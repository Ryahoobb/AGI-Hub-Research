# AGI HUB 記事パターン集

WIRED徹底分析から抽出した6種類のレイアウトパターン。各パターンは既存のAGI HUBモノトーン生成フローに追加する形で使う。

## パターン選択フロー

記事生成時、以下の順で判定する:

```
記事タイプ → パターン選択
─────────────────────────────────
論考・思想・抽象分析       → 1. Monolith（既存踏襲）
歴史・系譜・長文解説       → 2. Broadsheet
速報・発表・短いニュース   → 3. Dispatch
インタビュー・対談         → 4. Conversation
フォトエッセイ・現地ルポ   → 5. Photo Essay
調査報道・批評・論争       → 6. Investigation
```

アクセントカラーは `palette.json` の `accent` から1色だけ選ぶ。2色以上の混在禁止。

---

## Pattern 1: Monolith（既存踏襲）

**用途**: AGI HUBのコア記事（論考、アラインメント、タクオフ論争など抽象思想系）
**背景**: `#ffffff`（純白）
**アクセント**: なし（純モノトーン）
**画像アスペクト**: 16:7（既存通り）
**構成**: 5スライド（eyebrow + h1/h2 + lead段落 + 構造要素 + footer）

既存の `articles/ai-alignment.html` と同じ。変更なし。

```html
<body class="pattern-monolith">
  <div class="progress"></div>
  <nav class="nav">...</nav>
  <main>
    <section class="slide">
      <div class="eyebrow">The Long Arc</div>
      <h1>既存のヘッドライン</h1>
      <img class="hero ar-16-7" src="..." alt="">
      <p class="lead">...</p>
      <footer>...</footer>
    </section>
    <!-- 以下4スライド -->
  </main>
</body>
```

---

## Pattern 2: Broadsheet（ロングリード）

**用途**: 歴史・系譜・長文解説（10分以上の読了時間を想定）
**背景**: `#faf8f1`（クリームベース）
**アクセント**: 記事別に1色選択（例: `#2f2b92` deep blue for geopolitics）
**画像アスペクト**: 1:1ヒーロー + 16:9 本文内
**構成**: カバースライド + ドロップキャップ本文 + 2-3回の section-marker 区切り + pullquote

### 特徴
- **クリーム背景**で長文の目を守る
- **1:1ヒーロー**（スクエア）がWIRED近年のトレード
- **ドロップキャップ**で第1段落を装飾
- **セクションマーカー**（◆記号）で章を区切る
- pullquoteで議論の山場を強調

### HTML骨子
```html
<body class="pattern-broadsheet accent-deepblue">
  <main>
    <!-- Cover slide: 1:1 hero -->
    <section class="slide cover">
      <div class="eyebrow">Longread / Geopolitics</div>
      <h1 style="font-size:56px;line-height:1.0;">記事タイトル</h1>
      <p class="lead" style="font-size:20px;">サブタイトル</p>
      <img class="hero ar-1-1" src="..." alt="">
      <p class="caption">
        画像キャプション
        <span class="credit">PHOTOGRAPH: ...</span>
      </p>
    </section>

    <!-- Body with drop cap -->
    <section class="slide body">
      <p class="lead dropcap">
        Yudkowskyがアラインメントという語を鋳造したとき、
        それは現在の用法とは少し違う射程を持っていた...
      </p>

      <p>さらに続く段落...</p>

      <div class="section-marker">I</div>

      <p>次のセクション...</p>

      <blockquote class="pullquote">
        人類は既に一度、知能の設計原理を他者に委ねたことがある。
        <cite>— 本文より</cite>
      </blockquote>
    </section>
    <!-- 以下スライドが続く -->
  </main>
</body>
```

---

## Pattern 3: Dispatch（速報・短報）

**用途**: 研究発表、モデルローンチ、重要ニュースの速報
**背景**: `#ffffff`（白）
**アクセント**: `#0066ff`（WIREDブルー）固定
**画像アスペクト**: 16:9 単体ヒーロー
**構成**: 1-2スライドで完結。5スライド構成は使わない

### 特徴
- **短い**（1000-1500字）
- **情報密度が高い**
- アクセントブルーでdate/sourceを強調
- 関連リンクの横並びが末尾に入る

### HTML骨子
```html
<body class="pattern-dispatch">
  <main>
    <section class="slide dispatch">
      <div class="eyebrow" style="color:var(--accent);">Dispatch / 2026.04.09</div>
      <h1 style="font-size:44px;">速報：Anthropicが新モデルを発表</h1>

      <img class="hero ar-16-9" src="..." alt="">
      <p class="caption">写真の説明</p>

      <p class="lead">
        第1段落は要約。<span class="accent-underline">重要な固有名詞</span>にはアクセント下線。
      </p>

      <p>第2段落以降はファクト。</p>

      <!-- Key facts grid -->
      <div class="grid-3">
        <div class="card">
          <div class="num" style="color:var(--accent);">01</div>
          <p>ファクト1</p>
        </div>
        <div class="card">...</div>
        <div class="card">...</div>
      </div>

      <footer>
        <p class="eyebrow">Related Dispatches</p>
        <ul>...</ul>
      </footer>
    </section>
  </main>
</body>
```

---

## Pattern 4: Conversation（インタビュー・対談）

**用途**: 研究者インタビュー、CEO対談、想像上の論者対論
**背景**: `#f9f7ef`（クリーム・ウォーム）
**アクセント**: `#e96700`（バーントオレンジ）で質問を強調
**画像アスペクト**: 3:4 ポートレート（人物単独）
**構成**: Q/Aスタイル + pullquote多用 + 冒頭のポートレート

### 特徴
- **pullquoteを5-8回**使う（WIRED Big Interviewに倣う）
- Q&Aは `<dt>` で質問、`<dd>` で回答
- 質問は小さめ、回答は大きめ
- 人物ポートレート（3:4縦長）

### HTML骨子
```html
<body class="pattern-conversation accent-orange">
  <main>
    <section class="slide cover">
      <div class="eyebrow">The Big Interview</div>
      <h1>人物名×テーマ</h1>
      <p class="lead">リード文。この対話がどういう文脈で行われたか</p>
      <img class="hero ar-3-4" src="..." alt="人物ポートレート">
      <p class="caption">PHOTOGRAPH: ...</p>
    </section>

    <section class="slide qa">
      <dl class="qa-list">
        <dt class="q">Q. あなたが最初にアラインメント問題を意識したのはいつですか？</dt>
        <dd class="a">
          <p>2010年の論文を読んだときです。当時は誰も...</p>
        </dd>
      </dl>

      <blockquote class="pullquote">
        われわれは今もなお、問題を正しく定義する段階にいる。
        <cite>— インタビュイー</cite>
      </blockquote>

      <dl class="qa-list">
        <dt class="q">Q. 次の質問...</dt>
        <dd class="a">...</dd>
      </dl>
    </section>
  </main>
</body>

<style>
.qa-list dt.q {
  font-family: var(--ff-mono);
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--accent);
  text-transform: uppercase;
  margin-top: 32px;
  margin-bottom: 12px;
}
.qa-list dd.a {
  font-size: 18px;
  line-height: 1.7;
  margin: 0 0 24px;
}
</style>
```

---

## Pattern 5: Photo Essay（フォトエッセイ）

**用途**: 現地ルポ、AGI開発拠点訪問記、研究所巡礼、ビジュアル主役の記事
**背景**: `#000000`（純黒・ダーク反転）
**アクセント**: `#e6ff00`（ネオンイエロー）
**画像アスペクト**: ギャラリーで複数比率を混在（1:1, 16:9, 3:4）
**構成**: テキスト最小 + 写真ギャラリー中心

### 特徴
- **ダークモード反転**で写真が主役になる
- eyebrow/caption のみネオンイエロー
- 2x2 または 4列ギャラリー
- テキストは各写真のキャプション程度

### HTML骨子
```html
<body class="pattern-photoessay">
  <main>
    <section class="slide essay-cover">
      <div class="eyebrow">Photo Essay</div>
      <h1 style="font-size:56px;color:#fff;">タイトル</h1>
      <p class="lead" style="color:#aaa;">サブタイトル</p>
    </section>

    <section class="slide gallery">
      <img class="hero ar-1-1 hero-color" src="slide1.jpg">
      <p class="caption">1枚目キャプション<span class="credit">PHOTO: ...</span></p>

      <div class="gallery-grid-2">
        <figure>
          <img class="ar-3-4" src="slide2.jpg" style="width:100%;object-fit:cover;">
          <p class="caption">2枚目</p>
        </figure>
        <figure>
          <img class="ar-3-4" src="slide3.jpg" style="width:100%;object-fit:cover;">
          <p class="caption">3枚目</p>
        </figure>
      </div>

      <p style="font-size:18px;color:#ccc;max-width:640px;">
        本文は最小限。写真が語る。
      </p>

      <img class="ar-16-9 hero-color" src="slide4.jpg" style="width:100%;">
      <p class="caption">4枚目</p>
    </section>
  </main>
</body>
```

---

## Pattern 6: Investigation（調査報道・批評）

**用途**: 論争の論理的解剖、誤りの指摘、構造批判、調査ノート
**背景**: `#f3f1e9`（クリーム・ディープ）
**アクセント**: `#d00000`（アラートレッド）
**画像アスペクト**: 4:3 ドキュメント風
**構成**: タイムライン + エビデンスグリッド + 対比テーブル + 批判的pullquote

### 特徴
- クリーム背景が**調査資料の紙面**を思わせる
- 赤アクセントで**問題箇所をハイライト**
- タイムライン（時系列で事実整理）
- エビデンステーブル（主張 vs 反証）
- 警告ボックス（左ボーダー太め）

### HTML骨子
```html
<body class="pattern-investigation">
  <main>
    <section class="slide cover">
      <div class="eyebrow" style="color:var(--accent);">Investigation</div>
      <h1>見出し：何が間違っているか</h1>
      <p class="lead">リード文</p>
      <img class="hero ar-4-3" src="..." alt="">
    </section>

    <section class="slide body">
      <!-- Timeline -->
      <div class="timeline">
        <div class="item">
          <div class="num">2022</div>
          <p>最初の主張が公表される</p>
        </div>
        <div class="item">
          <div class="num">2024</div>
          <p>反証が登場</p>
        </div>
      </div>

      <!-- Evidence table -->
      <table class="compare">
        <thead><tr><th>主張</th><th>検証</th><th>結論</th></tr></thead>
        <tbody>
          <tr><td>...</td><td>...</td><td style="color:var(--accent);">反証</td></tr>
        </tbody>
      </table>

      <!-- Warning callout -->
      <aside class="warning-box">
        <strong>Critical:</strong> ここで議論が破綻している。
      </aside>

      <blockquote class="pullquote">
        論理の飛躍は、権威によって隠蔽される。
      </blockquote>
    </section>
  </main>
</body>

<style>
.warning-box {
  border-left: 4px solid var(--accent);
  padding: 20px 24px;
  background: rgba(208, 0, 0, 0.04);
  margin: 32px 0;
  font-size: 17px;
}
.warning-box strong { color: var(--accent); }
</style>
```

---

## Editorial Micro-typography（2026-04-18 WIRED追補）

記事単位では見えにくいが、蓄積するとメディア格を決める微細書式。全パターン共通で適用する。

### Byline prefix（クレジット表記）

`<span class="prefix">` で斜体の役割ラベルを前置する。記事の性格に応じて9種から選ぶ。

| Prefix | 用途 |
|---|---|
| `By` | 通常記事・署名原稿 |
| `Words by` | エッセイ・論考（文体を主張する記事） |
| `Reported by` | 調査報道・取材記事 |
| `Photography by` | フォトエッセイ・写真主導 |
| `Illustration by` | イラストが主体の記事 |
| `In Conversation with` | インタビュー・対談（Pattern 4） |
| `Edited by` | 編集者名を明示する場合 |
| `As told to` | 当事者の語りを編集者が構成 |
| `Interview by` | 短いQ&A形式 |

```html
<p class="byline">
  <span class="prefix">In Conversation with</span>
  <strong>Tanaka Ryo</strong>
</p>
```

### 日付書式

`YYYY.MM.DD`（ピリオド区切り）で統一。`YYYY/MM/DD` や `2026年4月18日` は記事本文側では使わない。数字は等幅（`tnum`）。

```html
<time class="date-wired" datetime="2026-04-18">2026.04.18</time>
```

### セクション区切り記号

Eyebrow内・キャプション内で複数要素を区切る際の記号運用:

| 記号 | 用途 | クラス |
|---|---|---|
| `::` | カテゴリの階層接続（親 :: 子） | `.sep-dot` |
| `—` | 並列の要素接続（著者 — 所属） | `.sep-em` |
| `/` | 選択肢・言い換え（Longread / Geopolitics） | `.sep-slash` |

全角スラッシュ `／` は使わない。半角 `/` の前後に半角スペースを入れない運用でもよい（eyebrow内の簡潔性優先）。

### Pull Quote 標準仕様

パターン2/4/6で共通の `.pullquote` を使う。パターン毎の独自スタイル定義はしない。

```html
<blockquote class="pullquote">
  引用本文は18-28px、`--fs-h2-s` を基準に。
  <cite>— 発話者名、肩書</cite>
</blockquote>
```

- 左2pxボーダー（`--accent`）
- 前後マージン `--space-5`（32px）
- `cite` は等幅フォント + オールキャップス
- 3〜4行以内に収める。長文は本文引用で扱う

### Motion tokens（palette.css）

| 用途 | Duration | Easing |
|---|---|---|
| リンクのホバー色 | `--dur-fast` (200ms) | `--ease-signature` |
| カードの浮き上がり | `--dur-base` (300ms) | `--ease-signature` |
| ヒーロー画像のフィルタ遷移 | `--dur-slow` (600ms) | `--ease-signature` |
| ヒーロー初期フェード | `--dur-hero` (900ms) | `--ease-signature` |

Signature easing は `cubic-bezier(0.23, 1, 0.32, 1)`（WIRED本家）。減速感が強く編集品らしい余韻が出る。`prefers-reduced-motion` は palette.css 側で自動的に無効化される。

### Spacing scale

4の倍数でrem管理。インラインstyleで `margin:32px` と書くのではなく `var(--space-5)` を使う。

| トークン | px | 典型用途 |
|---|---|---|
| `--space-1` | 4  | inline微調整 |
| `--space-2` | 8  | キャプションと図版 |
| `--space-3` | 16 | 段落内余白 |
| `--space-4` | 24 | 標準gutter |
| `--space-5` | 32 | ブロック間 |
| `--space-6` | 48 | セクション間 |
| `--space-7` | 64 | 章区切り |
| `--space-8` | 96 | ヒーロー前後 |

---

## 共通ルール

### やっていいこと
- パターンを跨いだ要素借用（Investigationのタイムラインを Monolith で使う等）
- アクセント色のフィルム的使用（下線、左ボーダー、数字のみ）
- 1:1 / 16:9 / 3:4 のアスペクト比使い分け

### やってはいけないこと
- 1記事で2色以上のアクセント併用
- 背景全体をアクセントで塗る
- box-shadow, gradient
- WIREDロゴやWIRED文字列
- パターン5以外でダーク反転を使う

### 画像配置の原則
- **ヒーローは1枚**。複数ヒーローは avoid
- **キャプションは必須**（画像の説明 + credit）
- **記事内で複数のアスペクト比を混ぜてよい**（変化を付ける）
- **サイズと配置は10種類のユーティリティから選ぶ**（下記 Image Placement Gallery）
- フィルター `grayscale(0.6) contrast(1.1)` がAGI HUBデフォルト。パターン5のみカラー

---

## Image Placement Gallery（10種）

記事本文は `--content-width: 680px`（約62ch）を基準幅とする。画像はこの本文幅との関係で10通りの配置をとる。`palette.css` の `.img-*` ユーティリティで実装。

| # | クラス | 幅 | 配置 | 主な用途 |
|---|---|---|---|---|
| 1 | `.img-fullbleed` | 100vw | 画面端まで | セクション切替、視覚的休符、特集オープナー |
| 2 | `.img-wide` | 1080px / 100vw-48px | 中央（本文超え） | 主要ヒーロー、引きのある資料画像 |
| 3 | `.img-content` | 680px | 本文と同幅 | 標準配置。説明的な図版 |
| 4 | `.img-center-small` | 420px | 中央・小 | 補助図、ポートレート縮小、アイコン的図版 |
| 5 | `.img-float-left` | 44% / 340px | 左寄せ・本文回り込み | 人物紹介、小カット、注釈図 |
| 6 | `.img-float-right` | 44% / 340px | 右寄せ・本文回り込み | サイドノート、引用画像、補助資料 |
| 7 | `.img-side-by-side` | 本文幅内2分割 | 2枚並列 | Before/After、対比、Diptych |
| 8 | `.img-grid-3` / `.img-grid-4` | 本文幅3-4分割 | 3-4枚グリッド | フォトエッセイ、研究拠点群、作例一覧 |
| 9 | `.img-overlay` | 1080px / 100vw-48px | 中央・テキスト重ね | 特集カバー、パート扉 |
| 10 | `.img-inline` / `.img-inline-thumb` | 1.4em / 96px | 段落内 | アイコン、ロゴ、段落先頭サムネ |

### CSSスニペット早見表

```html
<!-- 1. Full-bleed -->
<figure class="img img-fullbleed">
  <img src="hero.jpg" alt="">
  <figcaption class="caption">全画面幅の視覚的休符<span class="credit">PHOTO: UNSPLASH</span></figcaption>
</figure>

<!-- 2. Wide（コンテンツ幅超え） -->
<figure class="img img-wide">
  <img src="wide.jpg" alt="">
  <figcaption class="caption">本文幅を超える主要画像</figcaption>
</figure>

<!-- 3. Content-width -->
<figure class="img img-content">
  <img src="body.jpg" alt="">
  <figcaption class="caption">標準配置</figcaption>
</figure>

<!-- 4. Center small -->
<figure class="img img-center-small">
  <img src="small.jpg" alt="">
  <figcaption class="caption">補助図</figcaption>
</figure>

<!-- 5. Float left -->
<figure class="img img-float-left">
  <img src="portrait.jpg" alt="">
  <figcaption class="caption">人物カット</figcaption>
</figure>
<p>この段落は画像の右側に回り込む。floatを解除したい段落には <code>class="clear-floats"</code> を付ける。</p>

<!-- 6. Float right -->
<figure class="img img-float-right">
  <img src="sidenote.jpg" alt="">
</figure>

<!-- 7. Side by side -->
<div class="img-side-by-side">
  <figure><img src="a.jpg"><figcaption class="caption">Before</figcaption></figure>
  <figure><img src="b.jpg"><figcaption class="caption">After</figcaption></figure>
</div>

<!-- 8. Grid 3 / Grid 4 -->
<div class="img-grid-3">
  <img src="1.jpg"><img src="2.jpg"><img src="3.jpg">
</div>

<!-- 9. Overlay -->
<figure class="img img-overlay">
  <img src="cover.jpg" alt="">
  <div class="overlay-text">
    <div class="eyebrow">Longread</div>
    <h1>計算の神殿</h1>
  </div>
</figure>

<!-- 10. Inline -->
<p>このロジックは <img class="img-inline" src="logo.svg" alt=""> の初期版で既に見られた。</p>
<p><img class="img-inline-thumb" src="thumb.jpg" alt="">段落先頭にサムネイルを置き、本文が右側に回り込む短い紹介ブロック。</p>
```

### パターン別・推奨画像配置マッピング

各レイアウトパターンで主に使う画像配置クラスの推奨。必須ではなく、パターンを跨いだ借用は自由。

| パターン | 主力配置 | 補助配置 | 使わない |
|---|---|---|---|
| 1. Monolith | `img-content`（16:7） | `img-wide` / `img-center-small` | `img-overlay`（純モノトーンに反する） |
| 2. Broadsheet | `img-wide`（1:1 hero）+ `img-float-right` | `img-content` / `img-inline-thumb` | `img-grid-4`（情報密度が合わない） |
| 3. Dispatch | `img-content`（16:9） | `img-inline` | `img-fullbleed` / `img-overlay`（短報に不要） |
| 4. Conversation | `img-float-left`（3:4ポートレート） | `img-content` / `img-center-small` | `img-grid-3` |
| 5. Photo Essay | `img-fullbleed` + `img-grid-3` / `img-grid-4` | `img-side-by-side` / `img-overlay` | `img-inline`（テキスト最小で役割なし） |
| 6. Investigation | `img-content`（4:3） + `img-side-by-side`（対比） | `img-float-right`（資料）/ `img-inline-thumb` | `img-overlay`（調査資料の紙面感に反する） |

### 運用ルール
- 1記事で使う画像配置は**3種類以内**。多用するとノイズになる
- `img-fullbleed` と `img-overlay` は**記事に1回まで**（視覚的休符の価値が消える）
- `img-float-*` の直後の段落は最低3段落以上続ける。1段落だけで float を終えるとレイアウトが崩れる
- モバイル（768px未満）では `img-float-*` は自動で `float: none; width: 100%;` に落ちる（追加CSS必要時は記事側で指定）

## 運用

1. 新規記事作成時、記事タイプから自動でパターンを選択
2. `<body class="pattern-[name] accent-[color]">` で切り替え
3. palette.cssを記事HTMLの `<style>` にインライン展開（CDN依存を避ける）
4. 生成後、`design-system/SAMPLES/` に各パターンの実例HTMLを保存

---

# Chart Patterns

AGI HUBでデータを扱う記事のグラフテンプレート。WIRED（Datawrapper多用）、Economist（80%がbar/line/scatter、ダークブルー+赤アクセント）、FT（アノテーション直書き）の特性を、AGI HUBの「モノトーン基調 + アクセント1色」制約に再翻訳した。

## 設計原則

### やること
- **SVG直書き**。Chart.js等のライブラリには依存しない。記事HTMLが閉じた1ファイルで完結することを優先する
- **モノトーン階調 3-4段**（`--data-0`〜`--data-3`）+ アクセント1色。これ以上の色は使わない
- **凡例を避け、データ末端に直接ラベル**。凡例を探す視線移動を削減する
- **注目データ点だけアクセント色**。他はグレー階調で抑える
- **数値はtabular-nums**（等幅）。桁揃えで読みやすくする
- **キャプションは出典と解釈を分ける**。`.chart-caption` は解釈、`.chart-source` は出典
- **アノテーション歓迎**。特定の屈折点・外れ値には矢印と短文で意味を添える（FT流）
- **軸目盛りは必要最小限**。水平グリッドのみ、縦グリッドは原則なし

### やらないこと
- **3Dチャート**。Tufte原則違反。データインク比を下げるだけ
- **グラデーション塗り**（エリアチャートの半透明塗り以外）
- **アニメーション**。データが動く理由がない限り静止
- **ドーナツ・円グラフ**（3カテゴリ超）。横棒ランキングで代替する
- **2色以上のデータカラー**（モノトーン階調は可、ただしカラーは禁止）
- **ブランド色の氾濫**。アクセント1色の制約を超えない
- **凡例ブロック**。末端ラベルで代替する

### アクセシビリティ
- アクセント色は本文の `--accent` を継承する。記事内で既に保証されているコントラスト（WCAG AA相当）がそのまま適用される
- モノトーン階調は `#111 / #444 / #888 / #bcbcbc` の4段。隣接段階の差は最低25%の輝度差
- 色のみで情報を伝えない。必ずテキストラベル・ストローク幅・位置のいずれかを併用する
- `<svg role="img" aria-label="...">` を必須にする

### データインク比（Tufte原則）
- グリッド線は `#e5e5e5` で控えめに。軸線そのものは `#999` の薄い1本のみ
- 背景塗り・囲み枠・影は一切使わない
- 1つのチャートが伝えるメッセージは1つに絞る。複数の主張があるなら2つのチャートに分ける

### モバイル対応
- 縦長チャート（横棒ランキング、ダンベル、プログレス）は縦積みでそのまま縮小可
- 横長チャート（時系列の棒・線・エリア・スロープ）は 640px 未満で `chart-scroll-x` を付与し横スクロール可にする
- 文字サイズはSVG viewBox 基準で 11-12px。ブラウザ側で縮小されても可読性を保つ

## 10種のチャートテンプレート

| # | 名前 | 用途 | 主な軸 | 実装 |
|---|---|---|---|---|
| C1 | Vertical Bar | 時系列比較（6-10点） | カテゴリ × 値 | SVG |
| C2 | Horizontal Ranking | ランキング・構成比 | 値 × ラベル長 | SVG |
| C3 | Line (multi-series) | 時系列の複数系列比較 | 時間 × 値 | SVG |
| C4 | Area + Annotation | 累積成長・屈折点強調 | 時間 × 累積値 | SVG |
| C5 | Slope Chart | 2時点の多カテゴリ比較 | 時点A → 時点B | SVG |
| C6 | Dumbbell | 差分の強調（2条件の対比） | 値 × カテゴリ | SVG |
| C7 | Scatter | 相関・分布・外れ値 | 変数X × 変数Y | SVG |
| C8 | Stacked Bar | 構成比の推移 | 時間 × 100% | SVG |
| C9 | Big Number | 数値1-4個の強調 | — | HTML/CSS |
| C10 | Progress Bars | 進捗・達成率一覧 | ラベル × % | HTML/CSS |

### 共通構造

すべてのチャートは `<figure class="chart">` で囲む。

```html
<figure class="chart">
  <div class="chart-title">グラフのタイトル</div>
  <div class="chart-subtitle">1-2文の説明・前提</div>
  <svg class="chart-svg" viewBox="0 0 640 280" role="img" aria-label="説明">
    <!-- データ -->
  </svg>
  <figcaption class="chart-footer">
    <p class="chart-caption">解釈・補足（任意）</p>
    <p class="chart-source">出典表記</p>
  </figcaption>
</figure>
```

### チャート配置バリアント
- `.chart`（デフォルト）: 本文幅 680px
- `.chart.chart-wide`: 本文超え 1080px。主要チャートに
- `.chart.chart-inline`: 320px。段落内の補助チャートに

### キャプション・出典の書き方
- **タイトル**: 17px 太字。名詞句で要点を言い切る。「AIの訓練コスト」ではなく「GPT系モデルの訓練コスト推移」
- **サブタイトル**: 13px グレー。前提・単位・期間を1-2文で
- **キャプション** (`.chart-caption`): 12px グレー。データの解釈や読み方の補足。出典ではない
- **出典** (`.chart-source`): 10px モノ書体大文字。`SOURCE:` 接頭辞が自動付与される

### カラー変数（palette.css）

| 変数 | 値 | 用途 |
|---|---|---|
| `--data-0` | #111 | 最濃・主データ |
| `--data-1` | #444 | 副データ |
| `--data-2` | #888 | 第3データ |
| `--data-3` | #bcbcbc | 第4データ（背景的） |
| `--data-grid` | #e5e5e5 | グリッド線 |
| `--data-axis` | #999 | 軸線 |
| `--data-accent` | `var(--accent)` | 記事アクセントを継承 |

### SVG用クラス

| クラス | 対象 | 効果 |
|---|---|---|
| `.grid-line` | `<line>` | 水平グリッド線 |
| `.axis-line` / `.axis-zero` | `<line>` | 軸線・ゼロ線 |
| `.data-primary` | `<rect>`, `<circle>`, `<path>` | 最濃データ |
| `.data-secondary` | 同上 | 副データ |
| `.data-tertiary` | 同上 | 第3データ |
| `.data-accent` | 同上 | 強調データ（アクセント色） |
| `.data-label` | `<text>` | 値のラベル |
| `.data-label-accent` | `<text>` | 強調ラベル |
| `.annotation` | `<text>` | 注釈テキスト（斜体） |
| `.annotation-line` | `<line>`, `<path>` | 注釈線（破線） |
| `.line-path` | `<path>` | 折れ線 |
| `.area-path` | `<path>` | エリア塗り（半透明） |

## パターン別・推奨チャート相性表

各レイアウトパターンで推奨するチャートタイプ。禁止ではなく推奨。パターンを超えた借用は自由。

| パターン | 強相性 | 中相性 | 非推奨 |
|---|---|---|---|
| 1. Monolith | C1, C3, C5, C9 | C2, C7, C8, C10 | C4（純モノトーンでアクセント塗りが浮く） |
| 2. Broadsheet | C3, C4, C5, C7 | C1, C2, C9 | C10（情報密度が合わない） |
| 3. Dispatch | C9, C1, C10 | C2 | C4, C7（短報には複雑すぎる） |
| 4. Conversation | C9, C10 | C1, C5 | C3, C4, C7, C8（対談本文の流れを切る） |
| 5. Photo Essay | C9 | — | その他すべて（写真が主役のため） |
| 6. Investigation | C1, C2, C5, C6, C7 | C3, C4, C8 | C9単独（調査報道には文脈が必要） |

### 運用ルール
- 1記事で使うチャートは**3個以内**。情報過多を避ける
- 1記事で使うチャートタイプは**2種類以内**。視覚的一貫性を保つ
- Big Number (C9) は記事冒頭か末尾に1回だけ置く
- アクセント色は記事のパターン設定 (`accent-*` クラス) を継承。チャート側で独自の色を指定しない
- 長いキャプションは避ける。1-2文で書けなければ本文に吐き出す
- チャート直前後の段落でデータに言及する。孤立したチャートは置かない（Economist流）

## Dark mode（Pattern 5 Photo Essay）でのチャート

Photo Essayで数値を出す場合は C9 Big Number のみ推奨。その場合は以下の上書きが必要。

```css
.pattern-photoessay .chart-bignum { border-color: #333; }
.pattern-photoessay .chart-bignum .num { color: var(--accent); }
.pattern-photoessay .chart-bignum .label { color: #888; }
```

SVGチャート（C1-C8）をダークモードに持ち込む場合、`--data-0` 〜 `--data-3` を反転させる必要があり、現状は明示的な反転ユーティリティを用意していない。必要時に `chart-system-dark.css` として分離する。

---

# Table Patterns

記事内でデータを構造的に並べるためのテンプレート。装飾divで表を作らず、セマンティックな `<table>` を使う。スクリーンリーダー対応と行列アクセスのため。

## 設計原則

### 表を使うべきとき
- **3行以上の並列データで、列と行が明確に対応する**（製品 × 属性、プラン × 機能）
- **同じ型の値を比較する**（数値 × 数値、日付 × 日付）
- **読者が任意の行・列を拾い読みする**ユースケース

### 表を使うべきでないとき
- 2項目の対比 → 段落で書くか `.compare-ba`（Before/After）を使う
- 単純な順序リスト → `<ol>` か `.stepper` を使う
- 3項目以下の並列 → 箇条書きで済む
- 時系列が主軸 → タイムライン（`.timeline-v`）の方が読みやすい

### やること
- **セマンティック `<table>`** を使う。`<caption>` `<thead>` `<tbody>` `<th scope="col|row">` を必ず指定する
- **横罫のみ**。縦罫は省略する（編集紙面の伝統）。区切りは余白で作る
- **ゼブラストライプは使わない**。紙面が騒がしくなる。代わりに行間 padding を十分取る
- **数値列は右揃え**（`.num` クラス）。テキストは左揃え、中央揃えは記号列のみ
- **強調セルはアクセント色で文字色変更**、背景塗りはしない（推奨列を除く）
- **最上罫は2pxの太罫**、最下罫も2pxで締める。中間は1pxの細罫
- **モバイルでは `.table-scroll` で横スクロール**。表の列数を変えない

### やらないこと
- セル結合の多用（`colspan` `rowspan` は caption や header の下1段に限定）
- フォントサイズ10px未満
- 背景色のゼブラ・行ハイライト乱用
- Unicode装飾記号（★☆等）の乱用。マトリクスの◯△×は許容

### アクセシビリティ
- `<caption>` に表のタイトルを必ず入れる。視覚的には太字のタイトルに見える
- 行ヘッダには `<th scope="row">`、列ヘッダには `<th scope="col">` を指定
- 色だけで情報を伝えない。アクセント色セルには必ず記号かラベルを併記

## 5種のテーブルパターン

| # | 名前 | 用途 | 特徴 |
|---|---|---|---|
| T1 | Minimal Compare | 製品・概念の並列比較 | 横罫のみ、3-5列 |
| T2 | Spec Sheet | スペック・属性の列挙 | 行ヘッダ主体、2列中心 |
| T3 | Pricing Tiers | 料金・プラン比較 | 推奨列ハイライト、価格強調 |
| T4 | Ranking | 順位・スコア一覧 | インラインバー + 首位アクセント |
| T5 | Matrix Check | 機能対応マトリクス | ◯△×の記号列 |

### T1 Minimal Compare

3-5列のシンプルな比較表。各列は同格。

```html
<table class="table">
  <caption>主要アラインメント手法の比較<span class="sub">2026年時点の代表的アプローチ</span></caption>
  <thead>
    <tr>
      <th scope="col">手法</th>
      <th scope="col">提唱時期</th>
      <th scope="col">対象範囲</th>
      <th scope="col">主な批判</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">RLHF</th>
      <td>2017</td>
      <td>出力の選好整合</td>
      <td>内部状態を見ない</td>
    </tr>
    <!-- ... -->
  </tbody>
</table>
<p class="table-source">AGI HUB composite</p>
```

### T2 Spec Sheet

製品・モデル単体の属性列挙。1列目が属性名（行ヘッダ）、2列目以降が値。

```html
<table class="table table-spec">
  <caption>Model A-7 スペック</caption>
  <tbody>
    <tr><th scope="row">Parameters</th><td>70B</td></tr>
    <tr><th scope="row">Context Window</th><td class="num">128,000 tokens</td></tr>
    <tr><th scope="row">Training Data Cutoff</th><td>2025-10</td></tr>
    <tr><th scope="row">License</th><td>Research-only</td></tr>
  </tbody>
</table>
```

### T3 Pricing Tiers

料金表。推奨列を `.col-featured` でハイライト。

```html
<table class="table table-pricing">
  <caption>プラン比較<span class="sub">2026年4月時点</span></caption>
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Basic</th>
      <th scope="col" class="col-featured">Standard</th>
      <th scope="col">Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">月額</th>
      <td><span class="price">$29<span class="unit">/mo</span></span></td>
      <td class="col-featured">
        <span class="badge">Recommended</span>
        <span class="price">$99<span class="unit">/mo</span></span>
      </td>
      <td><span class="price">$499<span class="unit">/mo</span></span></td>
    </tr>
    <tr>
      <th scope="row">API呼び出し上限</th>
      <td class="num">10,000</td>
      <td class="col-featured num">100,000</td>
      <td class="num">無制限</td>
    </tr>
  </tbody>
</table>
```

### T4 Ranking

順位 + インラインバー + 首位アクセント。横棒チャートの軽量版として表形式で扱いたいとき。

```html
<table class="table table-rank">
  <caption>ベンチマークスコア</caption>
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">モデル</th>
      <th scope="col"></th>
      <th scope="col" class="num">Score</th>
    </tr>
  </thead>
  <tbody>
    <tr class="is-top">
      <td class="rank">01</td>
      <th scope="row">Crystal-X</th>
      <td class="bar-cell"><div class="inline-bar"><div class="fill" style="--w:96%"></div></div></td>
      <td class="val num">96.2</td>
    </tr>
    <tr>
      <td class="rank">02</td>
      <th scope="row">Helios-7</th>
      <td class="bar-cell"><div class="inline-bar"><div class="fill" style="--w:82%"></div></div></td>
      <td class="val num">82.1</td>
    </tr>
  </tbody>
</table>
```

### T5 Matrix Check

機能対応マトリクス。`.yes` `.partial` `.no` で ◯△× を段階表示。

```html
<table class="table table-matrix">
  <caption>機能対応表</caption>
  <thead>
    <tr>
      <th scope="col">機能</th>
      <th scope="col" class="center">Model A</th>
      <th scope="col" class="center">Model B</th>
      <th scope="col" class="center">Model C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Tool use</th>
      <td class="mark yes">◯<span class="mark-label">native</span></td>
      <td class="mark yes">◯</td>
      <td class="mark partial">△<span class="mark-label">beta</span></td>
    </tr>
    <tr>
      <th scope="row">Vision</th>
      <td class="mark yes">◯</td>
      <td class="mark no">×</td>
      <td class="mark yes">◯</td>
    </tr>
  </tbody>
</table>
```

## パターン別・推奨テーブル相性表

| レイアウト | 強相性 | 中相性 | 非推奨 |
|---|---|---|---|
| 1. Monolith | T1, T5 | T2, T4 | T3（料金表は論考記事と合わない） |
| 2. Broadsheet | T1, T2 | T4, T5 | T3 |
| 3. Dispatch | T2, T4 | T1 | T3（短報には情報密度が高すぎる） |
| 4. Conversation | — | T1 | T2, T3, T4, T5（対談の流れを切る） |
| 5. Photo Essay | — | — | 全て（写真が主役のため） |
| 6. Investigation | T1, T4, T5 | T2 | T3 |

---

# Infographic Patterns

数値チャート以外で情報を構造化するビジュアル。SVG直書き + HTML/CSS の組み合わせで実装する。外部ライブラリ依存なし。

## 設計原則

### 使うべきとき
- **時間軸がある**: タイムライン（I1）
- **順序・因果がある**: プロセスフロー（I2）、ステッパー（I6）
- **数値のサマリーを並列表示**: 統計カード（I3）
- **2状態の対比が必要**: Before/After（I4）
- **階層・所属関係がある**: ツリー（I5）
- **ノード間の関係が主題**: 関係図（I7）
- **構成比・割合を直感的に見せたい**: Isotype（I8）

### 情報の歪みを避けるセルフチェック
- **時間軸スケールを歪めていないか**: タイムラインで重要事象だけ間隔を広げない
- **ノードの大きさで意味を持たせていないか**: ツリーでサイズ差を付けるなら凡例を添える
- **因果でないものを矢印で繋いでいないか**: プロセスフローの矢印は時系列か依存関係のみ
- **カード数で印象操作していないか**: 統計カードは4-6枚を基本とし、恣意的に拡張しない
- **Before/Afterで片側を意図的に貧相に描いていないか**: 両側の情報粒度を揃える

### やること
- SVGは `viewBox` + `role="img"` + `aria-label` を必須にする
- 色は `--fg` / `--mid-gray` / `--border` / `--accent` の4段のみ
- テキストは直接SVG/HTML内に埋め込む（画像化しない）
- 矢印・線は1pxベース。太線は強調要素のみ2px
- 番号は mono font（`--ff-mono`）

### やらないこと
- 装飾アイコン（電球、歯車、矢印装飾体）。ピクトグラムは Isotype の抽象□のみ
- グラデーション、影、内側光彩
- 自作の派手なフレーム
- 色のみで意味を区別する表現

### アクセシビリティ
- すべての図に `<figcaption>` または前後の段落で「何を示す図か」を言葉でも説明
- SVGには `<title>` 子要素か `aria-labelledby` で代替テキスト
- 色だけで意味を分けず、位置・ラベル・形状で冗長化する

### モバイル対応
- I2 Process Flow: 640px未満で縦積みに変換（矢印も90度回転）
- I4 Before/After: 640px未満で1カラム
- I5 Tree: 縮尺維持のため親div `overflow-x: auto` でラップ
- I7 Relation Diagram: `preserveAspectRatio="xMidYMid meet"` で縮小
- I8 Isotype: ラベル幅を120pxに縮小、セル幅は可変

## 8種のインフォグラフィックパターン

| # | 名前 | 用途 | 実装 |
|---|---|---|---|
| I1 | Vertical Timeline | 年表・歴史・開発史 | HTML/CSS |
| I2 | Process Flow | 手順・パイプライン・ワークフロー | HTML/CSS |
| I3 | Stat Summary Cards | 統計サマリー一括提示 | HTML/CSS |
| I4 | Before/After | 2状態の対比 | HTML/CSS |
| I5 | Hierarchy Tree | 組織・階層・分類 | HTML/CSS |
| I6 | Stepper | 番号付き手順・チェックリスト | HTML/CSS |
| I7 | Relation Diagram | ノード関係図・システム図 | SVG |
| I8 | Isotype | ピクトグラム構成比 | HTML/CSS |

### I1 Vertical Timeline

```html
<figure class="info">
  <p class="info-title">アラインメント研究の系譜</p>
  <p class="info-subtitle">2001〜2025の主要マイルストーン</p>
  <div class="timeline-v">
    <div class="event is-key">
      <div class="year">2001</div>
      <h4 class="title">「アラインメント」概念の鋳造</h4>
      <p class="desc">Yudkowskyが最初期の用法を提示。最適化プロセスと設計者意図の整合が主題。</p>
    </div>
    <div class="event">
      <div class="year">2017</div>
      <h4 class="title">RLHFの実用化</h4>
      <p class="desc">強化学習による選好整合が主流化する。</p>
    </div>
  </div>
  <p class="info-source">AGI HUB composite</p>
</figure>
```

### I2 Process Flow

```html
<figure class="info info-wide">
  <p class="info-title">学習から公開までのパイプライン</p>
  <div class="process">
    <div class="step">
      <div class="n">Step 01</div>
      <h4 class="title">データ収集</h4>
      <p class="desc">公開ウェブ + ライセンス済みコーパス</p>
    </div>
    <div class="step">
      <div class="n">Step 02</div>
      <h4 class="title">事前学習</h4>
      <p class="desc">数ヶ月、数千GPU</p>
    </div>
    <div class="step">
      <div class="n">Step 03</div>
      <h4 class="title">整合学習</h4>
      <p class="desc">RLHF + 監督学習</p>
    </div>
    <div class="step">
      <div class="n">Step 04</div>
      <h4 class="title">評価・公開</h4>
      <p class="desc">レッドチーム + 段階リリース</p>
    </div>
  </div>
</figure>
```

### I3 Stat Summary Cards

```html
<figure class="info info-wide">
  <p class="info-title">2025年 モデル開発統計</p>
  <div class="stat-grid">
    <div class="cell">
      <div class="label">Released Models</div>
      <div class="num accent">127</div>
      <div class="delta up">+38 YoY</div>
    </div>
    <div class="cell">
      <div class="label">Avg Parameters</div>
      <div class="num">240<span class="unit">B</span></div>
      <div class="delta up">+62%</div>
    </div>
    <div class="cell">
      <div class="label">Train Compute</div>
      <div class="num">4.2<span class="unit">ZFLOPs</span></div>
      <div class="note">最大モデル推定</div>
    </div>
    <div class="cell">
      <div class="label">Open Weights</div>
      <div class="num">43<span class="unit">%</span></div>
      <div class="delta down">-9pt</div>
    </div>
  </div>
</figure>
```

### I4 Before/After

```html
<figure class="info">
  <p class="info-title">RLHF導入前と後</p>
  <div class="compare-ba">
    <div class="side is-before">
      <div class="tag">Before / 2019</div>
      <h4>命令追従の困難</h4>
      <p>ベースモデルは単語予測のみで、指示の意図把握が弱い。</p>
      <ul>
        <li>ゼロショット性能が低い</li>
        <li>プロンプトエンジニアリングに依存</li>
      </ul>
    </div>
    <div class="side is-after">
      <div class="tag">After / 2023</div>
      <h4>選好整合の実装</h4>
      <p>人間選好でのファインチューンで命令追従が一般化。</p>
      <ul>
        <li>対話インターフェイスが成立</li>
        <li>新しい安全性論点が発生</li>
      </ul>
    </div>
  </div>
</figure>
```

### I5 Hierarchy Tree

```html
<figure class="info">
  <p class="info-title">アラインメント研究の分類</p>
  <div class="tree">
    <div class="tree-root">
      <div class="node accent">Alignment<span class="sub">Field</span></div>
    </div>
    <div class="tree-row">
      <div class="node">Outer<span class="sub">Objective</span></div>
      <div class="node">Inner<span class="sub">Mesa-opt</span></div>
      <div class="node">Interpret<span class="sub">Mechanistic</span></div>
    </div>
  </div>
</figure>
```

### I6 Stepper

```html
<figure class="info">
  <p class="info-title">論文を読む手順</p>
  <ol class="stepper">
    <li>
      <h4>アブストラクトと結論だけ先に読む</h4>
      <p>主張を押さえてから本文に入る。枝葉に引きずられないため。</p>
      <div class="meta">所要 5分</div>
    </li>
    <li>
      <h4>図表を全部先に見る</h4>
      <p>データの形と実験条件を把握する。</p>
      <div class="meta">所要 10分</div>
    </li>
    <li>
      <h4>本文は反証可能性を意識して読む</h4>
      <p>主張の最も弱い点を特定してから妥当性を判定する。</p>
      <div class="meta">所要 30-60分</div>
    </li>
  </ol>
</figure>
```

### I7 Relation Diagram（SVG）

ノード + エッジの関係図。ノード位置は固定座標で決め打ちする。自動レイアウトはしない。

```html
<figure class="info info-wide">
  <p class="info-title">エージェント間の呼び出し関係</p>
  <svg class="relation-svg" viewBox="0 0 720 280" role="img" aria-label="エージェント構成図">
    <title>エージェント構成図</title>
    <!-- edges first (so they go under nodes) -->
    <line class="edge accent" x1="360" y1="60" x2="180" y2="180"/>
    <line class="edge accent" x1="360" y1="60" x2="360" y2="180"/>
    <line class="edge accent" x1="360" y1="60" x2="540" y2="180"/>
    <line class="edge dashed" x1="180" y1="220" x2="360" y2="220"/>
    <line class="edge dashed" x1="360" y1="220" x2="540" y2="220"/>

    <!-- root node -->
    <g transform="translate(300,30)">
      <rect class="node-box accent" width="120" height="44" x="0" y="0"/>
      <text class="node-label accent" x="60" y="22">Main Agent</text>
      <text class="node-sub" x="60" y="36">orchestrator</text>
    </g>
    <!-- child nodes -->
    <g transform="translate(120,180)">
      <rect class="node-box" width="120" height="44"/>
      <text class="node-label" x="60" y="22">Scout</text>
      <text class="node-sub" x="60" y="36">fact-gather</text>
    </g>
    <g transform="translate(300,180)">
      <rect class="node-box" width="120" height="44"/>
      <text class="node-label" x="60" y="22">Analyst</text>
      <text class="node-sub" x="60" y="36">synthesis</text>
    </g>
    <g transform="translate(480,180)">
      <rect class="node-box" width="120" height="44"/>
      <text class="node-label" x="60" y="22">Writer</text>
      <text class="node-sub" x="60" y="36">draft</text>
    </g>
  </svg>
  <p class="info-source">AGI HUB illustrative architecture</p>
</figure>
```

### I8 Isotype

```html
<figure class="info">
  <p class="info-title">モデルの出力用途内訳</p>
  <p class="info-subtitle">1マス=1%相当。100マスで全体。</p>
  <div class="isotype">
    <div class="row is-highlight">
      <div class="label">Code generation<span class="sub">developer</span></div>
      <div class="cells">
        <!-- 42 on, 58 off -->
      </div>
      <div class="val">42%</div>
    </div>
  </div>
</figure>
```

## パターン別・推奨インフォグラフィック相性表

| レイアウト | 強相性 | 中相性 | 非推奨 |
|---|---|---|---|
| 1. Monolith | I1, I5, I6 | I2, I3, I4, I7, I8 | — |
| 2. Broadsheet | I1, I4, I7 | I2, I3, I6 | I8（Broadsheetの文学的トーンに合いにくい） |
| 3. Dispatch | I3, I6 | I2, I8 | I1, I5, I7（短報には重い） |
| 4. Conversation | — | I1 | I2, I3, I5, I7, I8（対談の流れを切る） |
| 5. Photo Essay | — | I3（Big Number系のみ） | その他すべて |
| 6. Investigation | I1, I2, I4, I7 | I5, I6, I8 | I3単独 |

### 運用ルール
- 1記事で使うインフォグラフィックは**2個以内**。情報過多を避ける
- I7 Relation Diagram は**記事に1回まで**。1枚で関係の全体像を示す
- I3 Stat Summary Cards は C9 Big Number と役割が重なるため、**どちらか1種のみ**に統一する
- インフォグラフィック直前後の段落でデータ・構造に必ず言及する。孤立配置は避ける
