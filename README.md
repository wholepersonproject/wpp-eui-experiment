# WPP BioModels EUI Experiment

An MVP**0** for an interface for exploring WPP-relevant BioModels.

## Metadata Generation

The markdown file at `docs/metadata.md` is generated from `input-data/Glucose_Model_HRA_Mapping_v4.csv` by `src/gen-biomodels-markdown.js`.

Regenerate it with:

```bash
npm run generate:metadata
```

Each model section includes:

- An HTML anchor using the exact `Model_ID`, so fragment links like `#BIOMD0000000620` work.
- A level-two heading based on `Model_Name` and `Model_ID`.
- One bullet per CSV column, with underscores converted to spaces and field labels rendered in bold.
