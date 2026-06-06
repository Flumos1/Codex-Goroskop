# Input Schema

## Required For Natal Charts

- Birth date.
- Birth time.
- Birth place.

## Optional User Context

- Current location.
- Main question or life area.
- Preferred system: Western, Vedic, or both.
- Report mode: simple, advanced, or both.
- Language: Russian, Ukrainian, or English.

## Data Quality

### Exact Birth Time

Use for:

- Ascendant.
- Houses.
- Moon degree.
- Timing-sensitive calculations.

### Approximate Birth Time

Use with caution.

Report should say:

- Ascendant and houses may be unreliable.
- Moon placement may need verification if near sign boundary.

### Unknown Birth Time

Do not produce a full natal house-based report.

Allowed:

- Solar chart.
- Planet sign interpretation.
- Broad psychological themes.

## MVP Form Fields

- Name or nickname.
- Date of birth.
- Time of birth.
- Place of birth.
- Report depth: simple / advanced / both.
- Systems: Western / Vedic / both.
