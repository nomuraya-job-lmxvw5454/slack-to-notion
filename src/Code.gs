// Slack to Notion Knowledge Base
// Google Apps Script (GAS) implementation — Push型（Events API）
//
// Slackチャンネルに投稿されたURL含むメッセージを、
// Slack Events API経由でリアルタイムに受信し、Notionデータベースに保存する。
//
// ポーリング方式と異なり、Slackからメッセージが来た時だけ処理するため、
// 重複登録のリスクが構造的に排除される。

// === 設定 ===
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_TOKEN: props.getProperty('NOTION_TOKEN'),
    NOTION_DATABASE_ID: props.getProperty('NOTION_DATABASE_ID'),
    SLACK_CHANNEL_ID: props.getProperty('SLACK_CHANNEL_ID'),
    SLACK_WORKSPACE: props.getProperty('SLACK_WORKSPACE'),
    SLACK_SIGNING_SECRET: props.getProperty('SLACK_SIGNING_SECRET'),
  };
}

// === 社内URL除外パターン ===
// 以下のパターンに一致するURLは、Notionに保存されません
const INTERNAL_PATTERNS = [
  // プライベートネットワーク
  /https?:\/\/.*\.local/,
  /https?:\/\/localhost/,
  /https?:\/\/127\.0\.0\.1/,
  /https?:\/\/192\.168\./,
  /https?:\/\/10\./,
  /https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,

  // 社内ドメイン
  /https?:\/\/.*\.internal/,
  /https?:\/\/.*\.corp/,

  // 社内ツール例（実際の環境に合わせて編集）
  // /https?:\/\/jira\.yourcompany\.com/,
  // /https?:\/\/confluence\.yourcompany\.com/,
  // /https?:\/\/github\.yourcompany\.com/,
];

// === Slack Events API エントリポイント ===
// GASをWebアプリとしてデプロイすると、このURLにSlackからPOSTが来る
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // 1. URL Verification（初回セットアップ時にSlackが送信）
    if (body.type === 'url_verification') {
      return ContentService.createTextOutput(body.challenge);
    }

    // 2. Slackのリトライを検出してスキップ
    //    Slackは3秒以内にレスポンスがないとリトライする
    const retryNum = e.parameter && e.parameter['X-Slack-Retry-Num'];
    if (retryNum) {
      Logger.log(`リトライ検出（${retryNum}回目）: スキップ`);
      return ContentService.createTextOutput('ok');
    }

    // 3. イベントコールバック処理
    if (body.type === 'event_callback') {
      const event = body.event;

      // event_idで重複チェック（CacheService: 最大6時間TTL、自動消滅）
      const cache = CacheService.getScriptCache();
      const eventId = body.event_id;

      if (cache.get(eventId)) {
        Logger.log(`重複イベント検出: ${eventId}`);
        return ContentService.createTextOutput('ok');
      }

      // 処理済みとしてキャッシュ（6時間保持）
      cache.put(eventId, 'processed', 21600);

      // メッセージイベントのみ処理
      if (event.type === 'message' && !event.subtype) {
        processMessage(event);
      }
    }

    return ContentService.createTextOutput('ok');

  } catch (error) {
    Logger.log(`doPost エラー: ${error.message}`);
    Logger.log(error.stack);
    // エラーでもSlackに200を返す（リトライ防止）
    return ContentService.createTextOutput('ok');
  }
}

// === メッセージ処理 ===
function processMessage(event) {
  const config = getConfig();
  const text = event.text || '';
  const channel = event.channel;

  // 対象チャンネルのみ処理
  if (config.SLACK_CHANNEL_ID && channel !== config.SLACK_CHANNEL_ID) {
    Logger.log(`対象外チャンネル: ${channel}`);
    return;
  }

  // URL抽出
  const urls = extractUrls(text);

  if (urls.length === 0) {
    Logger.log(`スキップ（URL無し）: ${text.slice(0, 50)}`);
    return;
  }

  // 社内URL除外
  const externalUrls = urls.filter(url => !isInternalUrl(url));

  if (externalUrls.length === 0) {
    Logger.log(`スキップ（社内URLのみ）: ${urls.join(', ')}`);
    return;
  }

  // Notion保存
  Logger.log(`Notion保存: ${externalUrls.join(', ')}`);
  saveToNotion(event, externalUrls, config);
}

// === URL抽出 ===
function extractUrls(text) {
  // Slackの <URL|テキスト> 形式も考慮
  const bracketUrlRegex = /<(https?:\/\/[^|>]+)(?:\|[^>]+)?>/g;
  const normalUrlRegex = /https?:\/\/[^\s<>]+/g;

  const urls = [];

  // <URL|テキスト> 形式
  let match;
  while ((match = bracketUrlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  // 通常のURL
  const normalMatches = text.match(normalUrlRegex) || [];
  normalMatches.forEach(url => {
    if (!urls.includes(url)) {
      urls.push(url.replace(/[>).,;]$/, ''));
    }
  });

  return urls;
}

// === 社内URL判定 ===
function isInternalUrl(url) {
  return INTERNAL_PATTERNS.some(pattern => pattern.test(url));
}

// === Notion保存 ===
function saveToNotion(event, urls, config) {
  const text = event.text || '';
  const ts = event.ts;
  const channel = event.channel;
  const workspace = config.SLACK_WORKSPACE || 'workspace';
  const slackLink = `https://${workspace}.slack.com/archives/${channel}/p${ts.replace('.', '')}`;

  const url = 'https://api.notion.com/v1/pages';
  const payload = {
    parent: { database_id: config.NOTION_DATABASE_ID },
    properties: {
      Name: {
        title: [
          {
            text: { content: text.slice(0, 100) + (text.length > 100 ? '...' : '') }
          }
        ]
      },
      Content: {
        rich_text: [
          {
            text: { content: text.slice(0, 2000) }
          }
        ]
      },
      URLs: {
        rich_text: [
          {
            text: { content: urls.join('\n') }
          }
        ]
      },
      Source: {
        url: slackLink
      },
      Date: {
        date: { start: new Date(parseFloat(ts) * 1000).toISOString() }
      },
    },
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${config.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    Logger.log(`Notion API error: ${JSON.stringify(data)}`);
    throw new Error(`Notion API error: ${data.message || 'Unknown error'}`);
  }

  Logger.log(`Notion保存成功: ${data.id}`);
}

// === 簡易設定（コードで直接設定する場合） ===
function setupDirect() {
  const props = PropertiesService.getScriptProperties();

  // ↓ 実際の値に置き換えてください
  props.setProperty('NOTION_TOKEN', 'secret_your-notion-integration-token');
  props.setProperty('NOTION_DATABASE_ID', 'your-notion-database-id');
  props.setProperty('SLACK_CHANNEL_ID', 'C1234567890');
  props.setProperty('SLACK_WORKSPACE', 'yourworkspace');
  props.setProperty('SLACK_SIGNING_SECRET', 'your-slack-signing-secret');

  Logger.log('設定完了');
}

// === デプロイURL確認 ===
function showWebAppUrl() {
  Logger.log('デプロイ後、以下のURLをSlack Events APIのRequest URLに設定してください:');
  Logger.log('https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec');
  Logger.log('');
  Logger.log('デプロイ手順:');
  Logger.log('1. GASエディタ → デプロイ → 新しいデプロイ');
  Logger.log('2. 種類: ウェブアプリ');
  Logger.log('3. アクセスできるユーザー: 全員');
  Logger.log('4. デプロイ → URLをコピー');
}

// === 手動テスト（Events APIのシミュレーション） ===
function testWithSampleEvent() {
  Logger.log('=== テスト実行開始 ===');

  // サンプルイベントを作成
  const sampleEvent = {
    type: 'message',
    text: 'これ便利そう https://example.com/article 参考にしてね',
    channel: getConfig().SLACK_CHANNEL_ID,
    ts: (Date.now() / 1000).toString(),
    user: 'U1234567890',
  };

  processMessage(sampleEvent);

  Logger.log('=== テスト実行完了 ===');
}

// === 社内URLパターンのテスト ===
function testInternalPatterns() {
  const testUrls = [
    // 社内URL（除外されるべき）
    'https://192.168.1.1',
    'https://10.0.0.1/admin',
    'https://localhost:3000',
    'https://jira.internal/browse/PROJ-1',
    // 外部URL（保存されるべき）
    'https://example.com',
    'https://github.com/user/repo',
    'https://zenn.dev/articles/12345',
  ];

  testUrls.forEach(url => {
    const isInternal = isInternalUrl(url);
    Logger.log(`${isInternal ? '除外' : '保存'}: ${url}`);
  });
}
