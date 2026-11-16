# Translation maintenance / 双语内容维护

The English site at `/en/` shares graph structure with the Chinese site at `/`. Translation is static, versioned and reviewable; no visitor content or requests are sent to a translation provider.

## Files and stable identity

- UI messages and presentation helpers: `src/i18n/index.tsx`.
- Source matching, coverage and URL/date helpers: `src/i18n/content.mjs`.
- English content: `public/data/locales/en.json`, keyed by the unchanged philosopher, school and relationship IDs.
- Structure and Chinese source: `public/data/philosophy.json`. Never translate IDs, endpoints, Chinese school keys, coordinates, colours or numeric dates to change display language.
- HTML entry points: `index.html` and `en/index.html`; generated indexes and metadata: `scripts/site-content.mjs`.

## Edit a translation

Each field contains `source` (the exact normalized source array), `text` (the same number of translated strings) and `review` (`draft` or `reviewed`). JSON-encoded source arrays are normalized to arrays. Preserve intentionally blank source slots.

1. Find the entity by ID. Read the Chinese source, context and the related English fields.
2. Update `text`. If the Chinese source changed, translate the changed content before replacing `source` with its current normalized value. Merely refreshing `source` would incorrectly mark old English as current.
3. Use `draft` until the entire field has received editorial review. Explain terminology and title corrections in the PR and cite a reliable source when making a factual change. Do not mark a field reviewed merely because automated checks pass.
4. Run `npm run check:translations`, `npm test` and `npm run build`. Open `/en/` and the affected person or school; check mobile text wrapping and language-switch/share state.
5. Keep README.md and README.en.md aligned in all 13 sections. Their wording and media captions must accurately describe the language shown.

If a field is absent, malformed or no longer matches its source, the UI falls back to Chinese and the detail panel identifies the fallback. The build blocks incomplete or outdated content; a host with newer live data can still render Chinese fallback until translations catch up.

## Terminology and editorial scope

Use established English names: Empiricism, Continental Rationalism, German Idealism, Phenomenology, Existentialism, Analytic Philosophy, Pragmatism, Stoicism. Maintain distinctions between Forms / ideas, reason / understanding, spirit / mind, being / existence and their context-dependent translations.

Use conventional English book titles where identifiable (e.g. Republic, Nicomachean Ethics, Critique of Pure Reason, Being and Time, The Subjection of Women). Do not manufacture an original English quotation from a translated Chinese note. Until verified against an identified source and edition, quotations remain explicitly labelled as translated study material.

The initial English text was generated from the already-public Chinese snapshot using Google Translate, followed by manual curation of school and country/region labels, the two missing English names, selected common terms and book titles. General biographies and philosophical claims remain **machine-assisted drafts**, not a completed scholarly audit. The translation metadata and English detail panels state this. The Chinese snapshot and its provenance were not rewritten to imply verification.

## 中文维护摘要

- 中英文共用仓库、部署与图谱结构，译文按稳定 ID 单独维护；不新增数据库，不在访客浏览时调用翻译服务。
- 原文变动后必须同步重译，逐字段保留原文匹配和审核状态；覆盖率通过不等于史料或翻译已审校。
- 英文书名和哲学术语优先采用通行译法；没有核实出处的引语明确注明为转译。
- 两种语言分别输出真实 HTML、静态索引、自引用 canonical、互指 hreflang 和分享元信息；语言切换序列化当下人物、布局、搜索和筛选。
- ReadMap 主站复用时默认仍为中文；若要启用英文，需要宿主明确注入语言及匹配的公开译文，不把独立站路径硬编码到主站。
