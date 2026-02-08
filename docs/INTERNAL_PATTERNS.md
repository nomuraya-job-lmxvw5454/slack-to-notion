# 社内URLパターン設定ガイド

このドキュメントでは、Notionに保存したくない社内URLのパターンを設定する方法を説明します。

## 基本的な考え方

**社内URLパターン**は、以下のようなURLを自動的に除外するための正規表現のリストです:

- プライベートネットワーク（192.168.x.x、10.x.x.x等）
- 社内ドメイン（*.internal、*.corp等）
- 社内ツール（Jira、Confluence、GitHub Enterprise等）

## デフォルトのパターン

```javascript
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
];
```

## カスタマイズ例

### 1. 社内ツール（具体的なドメイン）

```javascript
// Jira
/https?:\/\/jira\.yourcompany\.com/,

// Confluence
/https?:\/\/confluence\.yourcompany\.com/,

// GitHub Enterprise
/https?:\/\/github\.yourcompany\.com/,

// GitLab
/https?:\/\/gitlab\.yourcompany\.com/,

// Jenkins
/https?:\/\/jenkins\.yourcompany\.com/,
```

### 2. 社内ドメイン全体

```javascript
// *.yourcompany.internal の全て
/https?:\/\/.*\.yourcompany\.internal/,

// *.yourcompany.corp の全て
/https?:\/\/.*\.yourcompany\.corp/,

// *.yourcompany.local の全て
/https?:\/\/.*\.yourcompany\.local/,
```

### 3. 特定のサブドメインパターン

```javascript
// dev-*.yourcompany.com（開発環境）
/https?:\/\/dev-.*\.yourcompany\.com/,

// staging-*.yourcompany.com（ステージング環境）
/https?:\/\/staging-.*\.yourcompany\.com/,

// *.internal.yourcompany.com
/https?:\/\/.*\.internal\.yourcompany\.com/,
```

### 4. ポート番号付きURL

```javascript
// localhost:3000, localhost:8080 等
/https?:\/\/localhost:\d+/,

// 192.168.x.x:port
/https?:\/\/192\.168\.\d+\.\d+:\d+/,
```

## パターンの追加手順

### ステップ1: パターンを特定

除外したい社内URLの例をリストアップ:

```
https://jira.acme-corp.com/browse/PROJECT-123
https://wiki.acme-corp.com/display/TEAM/Page
https://dev-app.acme-corp.com
https://192.168.1.100:8080
```

### ステップ2: 正規表現を作成

共通パターンを抽出:

```javascript
// jira.acme-corp.com → /https?:\/\/jira\.acme-corp\.com/
// wiki.acme-corp.com → /https?:\/\/wiki\.acme-corp\.com/
// dev-app.acme-corp.com → /https?:\/\/dev-.*\.acme-corp\.com/
// 192.168.1.100:8080 → /https?:\/\/192\.168\.\d+\.\d+:\d+/
```

### ステップ3: Code.gsに追加

```javascript
const INTERNAL_PATTERNS = [
  // 既存パターン...

  // Acme Corp社内ツール
  /https?:\/\/jira\.acme-corp\.com/,
  /https?:\/\/wiki\.acme-corp\.com/,
  /https?:\/\/dev-.*\.acme-corp\.com/,
  /https?:\/\/192\.168\.\d+\.\d+:\d+/,
];
```

### ステップ4: テスト

GASエディタで以下の関数を追加して実行:

```javascript
function testInternalPattern() {
  const testUrls = [
    'https://jira.acme-corp.com/browse/PROJECT-123',
    'https://example.com',
    'https://dev-app.acme-corp.com',
    'https://192.168.1.100:8080',
  ];

  testUrls.forEach(url => {
    const isInternal = isInternalUrl(url);
    Logger.log(`${url}: ${isInternal ? '社内URL（除外）' : '外部URL（保存）'}`);
  });
}
```

実行ログで判定結果を確認。

## 正規表現の基礎

| パターン | 説明 | 例 |
|---------|------|-----|
| `\.` | ドット（`.`）のエスケープ | `example\.com` |
| `.*` | 任意の文字0回以上 | `.*\.com` → `foo.com`, `bar.baz.com` |
| `\d+` | 数字1回以上 | `192\.168\.\d+\.\d+` → `192.168.1.1` |
| `(a\|b)` | aまたはb | `(jira\|confluence)\.com` |
| `^` | 行頭 | `^https://` |
| `$` | 行末 | `\.com$` |

## よくあるパターン集

### AWS VPC内部URL

```javascript
// VPC内部 (10.0.0.0/8)
/https?:\/\/10\.\d+\.\d+\.\d+/,

// VPC内部 (172.16.0.0/12)
/https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/,
```

### Google Cloud内部URL

```javascript
// *.internal
/https?:\/\/.*\.internal/,

// metadata.google.internal
/https?:\/\/metadata\.google\.internal/,
```

### Azure内部URL

```javascript
// *.local
/https?:\/\/.*\.local/,
```

### 社内Slack

```javascript
// Slackの社内ワークスペース
/https?:\/\/yourworkspace\.slack\.com/,
```

### 社内Google Workspace

```javascript
// Google Workspace (独自ドメイン)
/https?:\/\/drive\.google\.com\/.*yourcompany\.com/,
/https?:\/\/docs\.google\.com\/.*yourcompany\.com/,
```

## トラブルシューティング

### 外部URLが誤って除外される

**原因**: パターンが広すぎる

**例**:
```javascript
// NG: .com を含む全てのURL
/https?:\/\/.*\.com/,

// OK: 特定のドメインのみ
/https?:\/\/jira\.yourcompany\.com/,
```

### 社内URLが除外されない

**原因**: パターンが正しくない

**対処**:
1. 除外されないURLをコピー
2. `testInternalPattern` 関数でテスト
3. パターンを修正

**デバッグ例**:
```javascript
function debugPattern() {
  const url = 'https://jira.acme-corp.com/browse/PROJECT-123';
  const pattern = /https?:\/\/jira\.acme-corp\.com/;

  Logger.log(`URL: ${url}`);
  Logger.log(`Pattern: ${pattern}`);
  Logger.log(`Match: ${pattern.test(url)}`);
}
```

## ベストプラクティス

1. **具体的に書く**: `.*\.com` より `jira\.yourcompany\.com`
2. **テストする**: 追加前に `testInternalPattern` でテスト
3. **コメントを書く**: パターンの意図を明記
   ```javascript
   // 社内Jira（PROJECT管理）
   /https?:\/\/jira\.acme-corp\.com/,
   ```
4. **定期的に見直す**: 社内ツールの追加・廃止に合わせて更新

## 設定ファイルでの管理（将来対応）

現在はコード内で直接定義していますが、将来的には設定ファイルで管理することも可能です:

```yaml
# config/internal-patterns.yaml
patterns:
  - pattern: "jira\\.yourcompany\\.com"
    description: "社内Jira"
    enabled: true

  - pattern: "confluence\\.yourcompany\\.com"
    description: "社内Confluence"
    enabled: true
```

GASでYAMLをパースする仕組みが必要なため、現時点では推奨しません。

## まとめ

- 社内URLパターンは `Code.gs` の `INTERNAL_PATTERNS` 配列で定義
- 正規表現で柔軟にパターン指定可能
- `testInternalPattern` 関数で動作確認
- 定期的な見直しと更新を推奨
