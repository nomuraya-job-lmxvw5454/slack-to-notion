# セットアップ手順

## この手順で集める情報

最終的に以下の5つの値が必要です。手順を進めながら集めていきます。

| # | 値 | どこで取得するか | 形式の例 |
|---|-----|---------------|---------|
| A | Slack Signing Secret | ステップ1で取得 | `a1b2c3d4e5f6...` (32文字の英数字) |
| B | Slack チャンネルID | ステップ1で取得 | `C07ABCDEFGH` |
| C | Notion Token | ステップ2で取得 | `secret_abc123...` |
| D | Notion Database ID | ステップ3で取得 | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| E | Slack ワークスペース名 | ステップ1で取得 | `your-company` (URLの `xxx.slack.com` の `xxx` 部分) |

手順の中で「**→ メモ: A**」のように書いてあるところが、値を保存するタイミングです。
テキストエディタに以下のテンプレートを準備して、進めながら埋めてください。

```
A: Signing Secret  =
B: チャンネルID     =
C: Notion Token    =
D: Database ID     =
E: ワークスペース名 =
```

## 前提条件

- Node.js（v18以上推奨）
- Slackワークスペースの管理者権限（またはApp作成権限）
- Notionワークスペースへのアクセス権限
- Googleアカウント

---

## ステップ1: Slack App作成

### 1-1. Slack APIページを開く

1. ブラウザで https://api.slack.com/apps を開く
2. Slackアカウントでログインしていなければログイン

### 1-2. 新しいAppを作成する

1. 画面右上の緑色ボタン **Create New App** をクリック
2. ポップアップが出る → **From scratch** を選択
3. 入力フォームが表示される:
   - **App Name**: `Notion Knowledge Bot` と入力（好きな名前でOK）
   - **Pick a workspace**: ナレッジを貯めたいSlackワークスペースを選択
4. **Create App** ボタンをクリック

→ Appの設定画面（Basic Information）に遷移します。

### 1-3. Signing Secretを取得する

**今開いている画面（Basic Information）で操作します。**

1. 画面を下にスクロールして **App Credentials** セクションを探す
2. **Signing Secret** の右にある **Show** ボタンをクリック
3. 英数字の文字列が表示される
4. **Copy** ボタンをクリックしてコピー

**→ メモ: A（Signing Secret）に貼り付け**

### 1-4. ワークスペース名を確認する

1. 普段使っているSlackをブラウザで開く
2. URLバーを見る: `https://xxxxx.slack.com/...`
3. この `xxxxx` 部分がワークスペース名

**→ メモ: E（ワークスペース名）に記入**

### 1-5. Workspaceにインストールする

**Slack APIの設定画面に戻ります。**

1. 左のサイドバーメニューから **OAuth & Permissions** をクリック
2. ページ上部に **Install to Workspace** ボタンがある → クリック
3. 「XXXが以下のことを行うことを許可しますか？」という確認画面が出る
4. **許可する** をクリック

→ 元の画面に戻ります。Bot User OAuth Tokenが表示されますが、今回は使いません。

### 1-6. 対象チャンネルにBotを追加する

**Slackアプリ（デスクトップまたはブラウザ）で操作します。**

1. ナレッジを貯めたい対象チャンネルを開く
2. 画面上部の **チャンネル名** をクリック
3. ポップアップが開く → 上部のタブから **インテグレーション** をクリック
4. **アプリを追加する** をクリック
5. 検索欄に `Notion Knowledge Bot`（ステップ1-2で付けた名前）を入力
6. 表示されたら **追加** をクリック

→ チャンネルに「Notion Knowledge Botがこのチャンネルに参加しました」というメッセージが表示されます。

### 1-7. チャンネルIDを取得する

**引き続きSlackアプリで操作します。**

1. 対象チャンネルを開いた状態で、**チャンネル名** をクリック
2. ポップアップの一番下までスクロール
3. **チャンネルID** という項目がある（`C` で始まる英数字、例: `C07ABCDEFGH`）
4. IDの右にあるコピーアイコンをクリック

**→ メモ: B（チャンネルID）に貼り付け**

> **チャンネルIDが見つからない場合**:
> - Slackをブラウザで開く
> - 対象チャンネルを開く
> - URLの末尾を確認: `https://app.slack.com/client/T.../C07ABCDEFGH`
> - `C` で始まる部分がチャンネルID

---

## ステップ2: Notion Integration作成

### 2-1. Notion Integrationsページを開く

1. ブラウザで https://www.notion.so/profile/integrations を開く
2. Notionにログインしていなければログイン

### 2-2. 新しいIntegrationを作成する

1. **新しいインテグレーション** ボタン（または **New integration**）をクリック
2. 入力フォームが表示される:
   - **名前**: `Slack Knowledge Bot` と入力（好きな名前でOK）
   - **関連ワークスペース**: ナレッジを貯めたいNotionワークスペースを選択
   - **種類**: **内部**（Internal）のまま
3. **送信** ボタンをクリック

→ Integrationの設定画面に遷移します。

### 2-3. Tokenを取得する

**今開いている画面で操作します。**

1. **内部インテグレーションシークレット** (Internal Integration Secret) が表示されている
2. **表示** をクリック → `secret_` で始まるトークンが表示される
3. **コピー** をクリック

**→ メモ: C（Notion Token）に貼り付け**

> **注意**: このトークンは他人に見せないでください。このトークンがあればNotionのデータにアクセスできてしまいます。

---

## ステップ3: Notionデータベース作成

### 3-1. 新しいページを作成する

**Notionアプリまたはブラウザで操作します。**

1. Notionの左サイドバーで、ナレッジを貯めたい場所（ワークスペース直下やチームスペース内）を開く
2. **+ 新規ページ** をクリック（または既存ページ内でも可）
3. ページタイトルに `Slack Knowledge Base` と入力（好きな名前でOK）

### 3-2. データベース（テーブル）を作成する

1. ページ本文にカーソルを置く
2. `/database` と入力 → 候補が表示される
3. **テーブルビュー - インライン** (Table view - Inline) を選択
4. 「データソースを選択」と表示されたら **新規データベース** を選択

→ テーブルが作成されます。

### 3-3. プロパティ（列）を追加する

テーブルには最初「名前」列だけがあります。以下の列を追加します。

**「Content」列を追加:**
1. テーブルのヘッダー行の右端にある **+** をクリック
2. プロパティ名に `Content` と入力
3. タイプは **テキスト** を選択（デフォルトでテキストのはず）

**「URLs」列を追加:**
1. 再度 **+** をクリック
2. プロパティ名に `URLs` と入力
3. タイプは **テキスト** を選択

**「Source」列を追加:**
1. 再度 **+** をクリック
2. プロパティ名に `Source` と入力
3. タイプで **URL** を選択

**「Date」列を追加:**
1. 再度 **+** をクリック
2. プロパティ名に `Date` と入力
3. タイプで **日付** を選択

> **重要**: プロパティ名は **大文字小文字を正確に** 入力してください。
> `Name`（デフォルトの「名前」列を英語名にリネーム）, `Content`, `URLs`, `Source`, `Date` です。
>
> デフォルトの「名前」列は、列のヘッダーをクリックして `Name` にリネームしてください。

**最終的なテーブルのヘッダー:**
```
| Name | Content | URLs | Source | Date |
```

オプションで以下も追加できます（後からでもOK）:
- `Category`（タイプ: セレクト）→ 手動分類用
- `Tags`（タイプ: マルチセレクト）→ タグ付け用

### 3-4. Integrationをこのデータベースに接続する

**この手順を忘れると動きません。**

1. データベースがあるページの右上にある **...** （三点メニュー）をクリック
2. メニューを下にスクロール → **接続先** (Connections) を探す
3. **接続先** をクリック
4. 検索欄に `Slack Knowledge Bot`（ステップ2-2で付けた名前）を入力
5. 表示されたら選択 → **確認** をクリック

→ 「Slack Knowledge Botがこのページにアクセスできるようになりました」と表示されます。

### 3-5. Database IDを取得する

1. データベースがあるNotionページをブラウザで開く
2. URLバーを確認。以下のような形式:

```
https://www.notion.so/yourworkspace/a1b2c3d4e5f67890abcdef1234567890?v=...
```

3. `?v=` の **前** にある32文字の英数字が Database ID
   - 上の例では `a1b2c3d4e5f67890abcdef1234567890`

4. この部分をコピー

**→ メモ: D（Database ID）に貼り付け**

> **Database IDの見つけ方がわからない場合**:
> - ページURLの最後の `/` と `?` の間がDatabase ID
> - ハイフン付きの場合もある: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
> - どちらの形式でも動作します

---

## ここまでのチェック

以下の5つの値が全て揃っているか確認してください:

```
A: Signing Secret  = a1b2c3d4... (32文字の英数字)
B: チャンネルID     = C07ABCDEFGH
C: Notion Token    = secret_abc123...
D: Database ID     = a1b2c3d4e5f67890abcdef1234567890
E: ワークスペース名 = your-company
```

全て揃っていれば、次はCLI作業に進みます。

---

## ステップ4: clasp セットアップ & デプロイ

ここからはターミナル（コマンドライン）で完結します。

### 4-1. リポジトリをクローン

```bash
git clone https://github.com/nomuraya-job-lmxvw5454/slack-to-notion.git
cd slack-to-notion
npm install
```

### 4-2. Googleアカウントでログイン

```bash
npm run login
```

ブラウザが自動で開きます:
1. Googleアカウントを選択
2. 「Google Apps Script API がGoogleアカウントへのアクセスをリクエストしています」→ **許可**
3. 「承認が完了しました」と表示されればOK

> ブラウザが開かない場合: `npx clasp login --no-localhost` を試してください。URLが表示されるので手動でブラウザに貼り付けます。

### 4-3. GASプロジェクトを作成

```bash
npm run create
```

成功すると `.clasp.json` ファイルが生成されます。確認:
```bash
cat .clasp.json
```
→ `{"scriptId":"xxx","rootDir":"src"}` のような内容が表示されればOK。

### 4-4. コードをGASにアップロード

```bash
npm run push
```

→ `Pushed 2 files.` と表示されればOK。

### 4-5. Webアプリとしてデプロイ

```bash
npm run deploy
```

成功すると以下のような出力:
```
Created version 1.
- AKfycbx1234567890abcdefghijklmnop @1.
```

`AKfycb...` の部分が **DEPLOYMENT_ID** です。
以下のURLを構成して **メモ** してください:

```
https://script.google.com/macros/s/ここにDEPLOYMENT_IDを貼る/exec
```

例:
```
https://script.google.com/macros/s/AKfycbx1234567890abcdefghijklmnop/exec
```

### 4-6. 初回の権限承認

初回はGASにWeb経由のアクセス権限を付与する必要があります。

```bash
npm run open
```

→ ブラウザでGASエディタが開きます。

1. 画面上部のプルダウンで `showWebAppUrl` を選択
2. **実行** ボタン（▶）をクリック
3. 「承認が必要です」というポップアップが出る → **権限を確認**
4. Googleアカウントを選択
5. 「このアプリは確認されていません」→ 左下の **詳細** をクリック
6. **Slack to Notion（安全ではないページ）に移動** をクリック
7. **許可** をクリック

→ 権限承認が完了です。

---

## ステップ5: 環境変数設定

メモしておいた5つの値をGASに設定します。

### 5-1. Code.gsの設定関数を編集

`src/Code.gs` をテキストエディタで開き、`setupDirect` 関数を探して、メモした値を記入:

```javascript
function setupDirect() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('NOTION_TOKEN', 'ここにCの値');
  props.setProperty('NOTION_DATABASE_ID', 'ここにDの値');
  props.setProperty('SLACK_CHANNEL_ID', 'ここにBの値');
  props.setProperty('SLACK_WORKSPACE', 'ここにEの値');
  props.setProperty('SLACK_SIGNING_SECRET', 'ここにAの値');
  Logger.log('設定完了');
}
```

記入例:
```javascript
  props.setProperty('NOTION_TOKEN', 'secret_abc123def456...');
  props.setProperty('NOTION_DATABASE_ID', 'a1b2c3d4e5f67890abcdef1234567890');
  props.setProperty('SLACK_CHANNEL_ID', 'C07ABCDEFGH');
  props.setProperty('SLACK_WORKSPACE', 'your-company');
  props.setProperty('SLACK_SIGNING_SECRET', 'a1b2c3d4e5f6...');
```

### 5-2. GASにアップロードして実行

```bash
npm run push
npm run open
```

GASエディタが開いたら:
1. 画面上部のプルダウンで **setupDirect** を選択
2. **実行** ボタン（▶）をクリック
3. 画面下部の実行ログに `設定完了` と表示されればOK

### 5-3. ローカルのトークン値を消す（セキュリティ対策）

環境変数はGAS側に保存されたので、ローカルの `src/Code.gs` からトークン値を元に戻します:

```javascript
  props.setProperty('NOTION_TOKEN', 'secret_your-notion-integration-token');
  props.setProperty('NOTION_DATABASE_ID', 'your-notion-database-id');
  // ... 以下同様にプレースホルダーに戻す
```

**このファイルをcommitしないように注意。**

---

## ステップ6: Slack Events APIにGASのURLを登録

**Slack APIの設定画面に戻ります。**

### 6-1. Event Subscriptionsを有効化

1. https://api.slack.com/apps を開く
2. ステップ1で作成したApp（`Notion Knowledge Bot`）をクリック
3. 左のサイドバーメニューから **Event Subscriptions** をクリック
4. 画面上部の **Enable Events** トグルを **On** にする

### 6-2. Request URLを設定

1. **Request URL** という入力欄が表示される
2. ステップ4-5でメモしたWebアプリURLを貼り付ける:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
3. 入力すると自動的にSlackがURL検証リクエストを送信
4. 数秒待つ → URLの右に緑色で **Verified** と表示されれば成功

> **Verified にならない場合**:
> - ステップ4-6の権限承認が完了しているか確認
> - URLをブラウザに直接貼り付けてアクセスしてみる（何か表示されればGASは動いている）
> - `npm run deploy` を再実行してURLが正しいか確認

### 6-3. 受信するイベントを追加

1. 同じページを下にスクロール → **Subscribe to bot events** セクションを探す
2. **Add Bot User Event** ボタンをクリック
3. 検索欄に `message` と入力
4. **message.channels** を選択（「パブリックチャンネルのメッセージ」）
5. 画面右下の **Save Changes** をクリック

> **message.channels が見つからない場合**:
> 候補一覧から探してください。`message.channels` は「A message was posted to a channel」という説明がついています。

### 6-4. Appを再インストール

イベント設定を変更したので、Appを再インストールする必要があります。

1. 画面上部に黄色いバナーで「reinstall your app」と表示されている場合、そのリンクをクリック
2. 表示されていない場合: 左サイドバー → **OAuth & Permissions** → **Reinstall to Workspace**
3. **許可する** をクリック

---

## ステップ7: 動作確認

### 7-1. テスト投稿

1. Slackの対象チャンネルを開く
2. 以下のメッセージを投稿:
   ```
   テスト https://example.com
   ```
3. 数秒〜10秒後、Notionの `Slack Knowledge Base` データベースを確認
4. 新しい行が追加されていればOK:
   - Name: `テスト https://example.com`
   - URLs: `https://example.com`
   - Source: Slackメッセージへのリンク

### 7-2. 社内URL除外の確認

1. 以下のメッセージを投稿:
   ```
   社内ページ https://192.168.1.100/wiki
   ```
2. Notionに保存**されない**ことを確認（社内URLパターンに該当するため）

### 7-3. URL無し投稿の確認

1. 以下のメッセージを投稿:
   ```
   これはURLなしのメッセージです
   ```
2. Notionに保存**されない**ことを確認（URL含まないため）

### 7-4. ログの確認

```bash
npm run logs
```
→ 処理履歴が表示されます。「Notion保存成功」「スキップ」などのログが確認できます。

---

## セットアップ完了

以上で全てのセットアップが完了です。
今後、対象チャンネルにURL含む投稿をすると、自動的にNotionに保存されます。

---

## 日常の運用

### コードを変更した場合

```bash
npm run deploy
```
URLは変わりません。Slack側の設定変更は不要です。

### 社内URLパターンを追加する場合

`src/Code.gs` の `INTERNAL_PATTERNS` 配列に正規表現を追加 → `npm run deploy`。
詳細は [INTERNAL_PATTERNS.md](./INTERNAL_PATTERNS.md) を参照。

### 一時停止したい場合

Slack管理画面 → **Event Subscriptions** → **Enable Events** を **Off**。

### 再開したい場合

同画面で **On** に戻す。

---

## CLIコマンドまとめ

| コマンド | 用途 |
|---------|------|
| `npm run login` | Googleアカウントでログイン |
| `npm run create` | GASプロジェクト作成 |
| `npm run push` | コードをGASにアップロード |
| `npm run deploy` | push + Webアプリデプロイ |
| `npm run open` | GASエディタをブラウザで開く |
| `npm run logs` | 実行ログを表示 |

---

## トラブルシューティング

### 全般

| 症状 | 確認すること |
|------|------------|
| 何も起きない | Slackのチャンネルにアプリが追加されているか（ステップ1-6） |
| 何も起きない | Event Subscriptionsが**On**になっているか（ステップ6-1） |
| 何も起きない | `message.channels`が追加されているか（ステップ6-3） |
| Notionに保存されない | IntegrationがデータベースにConnectされているか（ステップ3-4） |
| Notionエラー | プロパティ名が正確か（Name, Content, URLs, Source, Date — 大文字小文字に注意） |
| URL Verificationが失敗 | 権限承認が完了しているか（ステップ4-6） |

### 詳細なログを見たい場合

```bash
npm run open
```
GASエディタの左メニュー → **実行数** タブをクリック → 各実行のログを確認。
