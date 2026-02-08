// Slack to Notion Knowledge Base
// Google Apps Script (GAS) implementation
//
// このスクリプトは、Slackチャンネルの新規メッセージを監視し、
// URL含む投稿を自動的にNotionデータベースに保存します。

// === 設定 ===
const CONFIG = {
  SLACK_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN'),
  NOTION_TOKEN: PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN'),
  NOTION_DATABASE_ID: PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID'),
  SLACK_CHANNEL_ID: PropertiesService.getScriptProperties().getProperty('SLACK_CHANNEL_ID'),
  SLACK_WORKSPACE: PropertiesService.getScriptProperties().getProperty('SLACK_WORKSPACE'), // 例: yourworkspace
  LAST_PROCESSED_TS: 'LAST_PROCESSED_TS', // プロパティキー
};

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

// === メイン処理（トリガーで1分間隔実行） ===
function processSlackMessages() {
  try {
    const lastTs = PropertiesService.getScriptProperties().getProperty(CONFIG.LAST_PROCESSED_TS) || '0';

    const messages = fetchNewMessages(lastTs);

    if (messages.length === 0) {
      Logger.log('新規メッセージなし');
      return;
    }

    Logger.log(`${messages.length}件の新規メッセージを処理`);

    let latestTs = lastTs;
    let savedCount = 0;
    let skippedCount = 0;

    messages.forEach(msg => {
      if (parseFloat(msg.ts) > parseFloat(latestTs)) {
        latestTs = msg.ts;
      }

      const text = msg.text || '';
      const urls = extractUrls(text);

      if (urls.length === 0) {
        Logger.log(`スキップ（URL無し）: ${text.slice(0, 50)}`);
        skippedCount++;
        return;
      }

      const externalUrls = urls.filter(url => !isInternalUrl(url));

      if (externalUrls.length === 0) {
        Logger.log(`スキップ（社内URLのみ）: ${urls.join(', ')}`);
        skippedCount++;
        return;
      }

      Logger.log(`Notion保存: ${externalUrls.join(', ')}`);
      saveToNotion(msg, externalUrls);
      savedCount++;
    });

    PropertiesService.getScriptProperties().setProperty(CONFIG.LAST_PROCESSED_TS, latestTs);
    Logger.log(`処理完了: ${savedCount}件保存, ${skippedCount}件スキップ, 最終TS: ${latestTs}`);

  } catch (error) {
    Logger.log(`エラー発生: ${error.message}`);
    Logger.log(error.stack);
    throw error;
  }
}

// === Slackメッセージ取得 ===
function fetchNewMessages(afterTs) {
  const url = 'https://slack.com/api/conversations.history';
  const params = {
    channel: CONFIG.SLACK_CHANNEL_ID,
    oldest: afterTs,
    limit: 100,
  };

  const queryString = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${CONFIG.SLACK_BOT_TOKEN}`,
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(`${url}?${queryString}`, options);
  const data = JSON.parse(response.getContentText());

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  // 通常のメッセージのみ（botメッセージ、編集、削除等を除外）
  return data.messages
    .filter(m => m.type === 'message' && !m.subtype)
    .reverse(); // 古い順に処理
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
    // 既に抽出済みでないか確認
    if (!urls.includes(url)) {
      urls.push(url.replace(/[>).,;]$/, '')); // 末尾の記号除去
    }
  });

  return urls;
}

// === 社内URL判定 ===
function isInternalUrl(url) {
  return INTERNAL_PATTERNS.some(pattern => pattern.test(url));
}

// === Notion保存 ===
function saveToNotion(message, urls) {
  const text = message.text || '';
  const ts = message.ts;
  const channelId = CONFIG.SLACK_CHANNEL_ID;
  const workspace = CONFIG.SLACK_WORKSPACE || 'workspace';
  const slackLink = `https://${workspace}.slack.com/archives/${channelId}/p${ts.replace('.', '')}`;

  const url = 'https://api.notion.com/v1/pages';
  const payload = {
    parent: { database_id: CONFIG.NOTION_DATABASE_ID },
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
            text: { content: text.slice(0, 2000) } // Notion制限: 2000文字
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
      'Authorization': `Bearer ${CONFIG.NOTION_TOKEN}`,
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

// === 初期設定（最初に1回だけ実行） ===
function setup() {
  const ui = SpreadsheetApp.getUi(); // または DocumentApp.getUi()

  // 環境変数を対話的に設定
  const slackToken = ui.prompt('Slack Bot Token', 'xoxb-... を入力してください', ui.ButtonSet.OK_CANCEL);
  if (slackToken.getSelectedButton() !== ui.Button.OK) return;

  const notionToken = ui.prompt('Notion Token', 'secret_... を入力してください', ui.ButtonSet.OK_CANCEL);
  if (notionToken.getSelectedButton() !== ui.Button.OK) return;

  const databaseId = ui.prompt('Notion Database ID', 'データベースIDを入力してください', ui.ButtonSet.OK_CANCEL);
  if (databaseId.getSelectedButton() !== ui.Button.OK) return;

  const channelId = ui.prompt('Slack Channel ID', 'C... を入力してください', ui.ButtonSet.OK_CANCEL);
  if (channelId.getSelectedButton() !== ui.Button.OK) return;

  const workspace = ui.prompt('Slack Workspace', 'ワークスペース名を入力してください（例: yourworkspace）', ui.ButtonSet.OK_CANCEL);
  if (workspace.getSelectedButton() !== ui.Button.OK) return;

  const props = PropertiesService.getScriptProperties();
  props.setProperty('SLACK_BOT_TOKEN', slackToken.getResponseText());
  props.setProperty('NOTION_TOKEN', notionToken.getResponseText());
  props.setProperty('NOTION_DATABASE_ID', databaseId.getResponseText());
  props.setProperty('SLACK_CHANNEL_ID', channelId.getResponseText());
  props.setProperty('SLACK_WORKSPACE', workspace.getResponseText());

  // 初期タイムスタンプ（現在時刻）
  props.setProperty('LAST_PROCESSED_TS', (Date.now() / 1000).toString());

  ui.alert('設定完了', '環境変数を設定しました', ui.ButtonSet.OK);
  Logger.log('設定完了');
}

// === 簡易設定（コードで直接設定する場合） ===
function setupDirect() {
  const props = PropertiesService.getScriptProperties();

  // ↓ 実際の値に置き換えてください
  props.setProperty('SLACK_BOT_TOKEN', 'xoxb-your-slack-bot-token');
  props.setProperty('NOTION_TOKEN', 'secret_your-notion-integration-token');
  props.setProperty('NOTION_DATABASE_ID', 'your-notion-database-id');
  props.setProperty('SLACK_CHANNEL_ID', 'C1234567890');
  props.setProperty('SLACK_WORKSPACE', 'yourworkspace');

  // 初期タイムスタンプ（現在時刻）
  props.setProperty('LAST_PROCESSED_TS', (Date.now() / 1000).toString());

  Logger.log('設定完了');
}

// === トリガー設定（最初に1回だけ実行） ===
function createTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processSlackMessages') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 新しいトリガーを作成（1分間隔）
  ScriptApp.newTrigger('processSlackMessages')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('トリガー作成完了（1分間隔）');
}

// === トリガー削除 ===
function deleteTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'processSlackMessages') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('トリガー削除: ' + trigger.getUniqueId());
    }
  });
  Logger.log('トリガー削除完了');
}

// === 手動テスト実行 ===
function testRun() {
  Logger.log('=== テスト実行開始 ===');
  processSlackMessages();
  Logger.log('=== テスト実行完了 ===');
}
