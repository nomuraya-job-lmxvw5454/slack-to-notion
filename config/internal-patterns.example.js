// 社内URLパターン設定例
// このファイルは参考用です。実際の設定は src/Code.gs の INTERNAL_PATTERNS を編集してください。

const INTERNAL_PATTERNS_EXAMPLES = [
  // ========================================
  // プライベートネットワーク
  // ========================================

  // ローカルホスト
  /https?:\/\/localhost/,
  /https?:\/\/127\.0\.0\.1/,
  /https?:\/\/.*\.local/,

  // RFC 1918 プライベートアドレス
  /https?:\/\/10\./,                                  // 10.0.0.0/8
  /https?:\/\/192\.168\./,                            // 192.168.0.0/16
  /https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,        // 172.16.0.0/12

  // ポート番号付きローカルURL
  /https?:\/\/localhost:\d+/,
  /https?:\/\/127\.0\.0\.1:\d+/,

  // ========================================
  // 社内ドメイン
  // ========================================

  // 一般的な社内ドメイン
  /https?:\/\/.*\.internal/,
  /https?:\/\/.*\.corp/,
  /https?:\/\/.*\.intranet/,

  // 特定の社内ドメイン（例: acme-corp.com）
  /https?:\/\/.*\.acme-corp\.internal/,
  /https?:\/\/.*\.acme-corp\.corp/,
  /https?:\/\/.*\.acme-corp\.local/,

  // ========================================
  // 開発・ステージング環境
  // ========================================

  // 開発環境
  /https?:\/\/dev-.*\.acme-corp\.com/,
  /https?:\/\/.*\.dev\.acme-corp\.com/,

  // ステージング環境
  /https?:\/\/staging-.*\.acme-corp\.com/,
  /https?:\/\/.*\.staging\.acme-corp\.com/,

  // テスト環境
  /https?:\/\/test-.*\.acme-corp\.com/,
  /https?:\/\/.*\.test\.acme-corp\.com/,

  // ========================================
  // 社内ツール（具体例）
  // ========================================

  // Jira
  /https?:\/\/jira\.acme-corp\.com/,
  /https?:\/\/.*\.atlassian\.net/,  // Jira Cloud（社内Workspace）

  // Confluence
  /https?:\/\/confluence\.acme-corp\.com/,
  /https?:\/\/wiki\.acme-corp\.com/,

  // GitHub Enterprise
  /https?:\/\/github\.acme-corp\.com/,

  // GitLab
  /https?:\/\/gitlab\.acme-corp\.com/,

  // Jenkins
  /https?:\/\/jenkins\.acme-corp\.com/,
  /https?:\/\/ci\.acme-corp\.com/,

  // Slack（社内Workspace）
  /https?:\/\/acme-corp\.slack\.com/,

  // Google Workspace（独自ドメイン）
  /https?:\/\/drive\.google\.com\/.*acme-corp\.com/,
  /https?:\/\/docs\.google\.com\/.*acme-corp\.com/,

  // ========================================
  // クラウド内部URL
  // ========================================

  // AWS VPC内部
  /https?:\/\/ip-10-\d+-\d+-\d+/,  // 例: ip-10-0-1-100

  // Google Cloud Metadata
  /https?:\/\/metadata\.google\.internal/,

  // Azure Metadata
  /https?:\/\/169\.254\.169\.254/,

  // ========================================
  // 社内サービス
  // ========================================

  // 人事システム
  /https?:\/\/hr\.acme-corp\.com/,
  /https?:\/\/workday\.acme-corp\.com/,

  // 経費精算
  /https?:\/\/expense\.acme-corp\.com/,
  /https?:\/\/concur\.acme-corp\.com/,

  // 勤怠管理
  /https?:\/\/attendance\.acme-corp\.com/,
  /https?:\/\/teamspirit\.acme-corp\.com/,

  // ========================================
  // その他
  // ========================================

  // 社内Webメール
  /https?:\/\/mail\.acme-corp\.com/,
  /https?:\/\/webmail\.acme-corp\.com/,

  // 社内ポータル
  /https?:\/\/portal\.acme-corp\.com/,
  /https?:\/\/intranet\.acme-corp\.com/,
];

// ========================================
// 使用例
// ========================================

// このファイルをコピーして src/Code.gs の INTERNAL_PATTERNS に必要なパターンをコピーしてください。

// 例:
// const INTERNAL_PATTERNS = [
//   /https?:\/\/localhost/,
//   /https?:\/\/jira\.acme-corp\.com/,
//   /https?:\/\/confluence\.acme-corp\.com/,
// ];
