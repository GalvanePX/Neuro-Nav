# NeuroNav

**Neurological Exam → Brain Topology**

An educational neurological localization app created by Henrique Cachoeira Galvane with AI-assisted development.

Observed findings lead to anatomical constraints, candidate localizations, supporting features, contradictions and compatible syndromes. A 3D atlas illustrates anatomical context.

## Features

- Simple mode: 18 core NIHSS-style findings. Expanded mode: 48 brain-relevant findings.
- Transparent localization rules, uncertainty and competing explanations.
- Interactive 3D cortical parcels and deep structures, with a compatibility renderer.
- Local English/Portuguese examination phrase matching; users review matches before applying.
- Collapsible examination categories and preserved selections across modes.

## Upload to GitHub

1. Extract this ZIP.
2. Create a repository named `neuronav`. Choose **Private** to keep your source repository private.
3. Upload the **contents inside the NeuroNav folder**, including `.github`, `.gitignore`, `dist`, `scripts` and the root files. Do not upload only the ZIP or nest the entire NeuroNav folder inside the repository.
4. Commit the files. GitHub Desktop can help include folders hidden by your file browser.

Uploading the repository does not publish a website. The included Pages workflow is manually triggered only.

## Optional: GitHub Pages

1. In repository **Settings → Pages**, select **GitHub Actions** as the source.
2. In **Actions**, choose **Publish NeuroNav to GitHub Pages**, then **Run workflow** on the default branch.
3. After success, use the URL shown by GitHub.
4. Repeat Run workflow to publish future changes.

The workflow publishes `dist/` directly. No build or API key is required. Relative asset paths support repository subpaths.

Pages eligibility depends on your GitHub plan and repository visibility. A private repository does not hide JavaScript downloaded by visitors to a published site.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Run locally

With Python 3, from the project root:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. Use an HTTP server rather than double-clicking index.html, because modules and anatomical data are loaded by the browser.

Optional Vite development server (Node.js 22.12+):

```sh
npm ci
npm run dev
```

Regression checks:

```sh
node scripts/verify.cjs
```

Checks cover example patterns, laterality, contradictions, geometry, local asset references, phrase matching and mode controls. They do not establish clinical validity.

## Project files

- `dist/`: Complete runnable app, including editable HTML, CSS and JavaScript.
- `dist/assets/`: Meshes, logo, provenance and data licenses.
- `dist/vendor/`: Three.js modules and license.
- `scripts/verify*.cjs`: Regression checks.
- `scripts/prepare-anatomy.py` and `scripts/subdivide-anatomy.py`: Optional anatomy preprocessing. Generated assets are included. Regeneration requires internet access, numpy, nibabel, scipy and scikit-image; upstream datasets may change.
- `.github/workflows/pages.yml`: Optional manual publication.

## Clinical scope

Educational prototype, not intended for patient care. Rule weights are author-defined, unvalidated and not probabilities. Simple mode is not a complete NIHSS assessment and does not calculate an NIHSS score. Template anatomy is not a patient scan. Highlighted parcels illustrate candidate networks, not diagnosed lesion boundaries. Spinal, peripheral, multifocal and systemic explanations may remain possible. Clinical references and limitations are available in the app.

The deterministic phrase matcher runs locally without sending exam text to an AI service. It is not unrestricted clinical natural-language understanding.

## Attribution and reuse

Preserve `dist/assets/ATTRIBUTION.txt`, FreeSurfer and Nilearn license files, and `dist/vendor/THREE-LICENSE.txt`. Third-party materials retain their respective terms. This export does not add an open-source license for the original application code.

## Provenance

Application source commit: `0e457a64c234ccfae3059a9d459d02a598c2ccea`.

Packaging adds documentation, manual Pages publication and portable development configuration. Credentials, hosted-site access settings and Git history are excluded.
