# Data Model: Gerador de Selo Eu Voto

## Frame

| Field | Type | Rules |
|---|---|---|
| id | string | unique, stable, `modelo-1` … `modelo-3` |
| name | string | visible label, required |
| overlayUrl | path | local asset, required |
| safeCircle | object | center/radius for the photo crop; radius may vary by frame |
| photoRadius | number | target radius in the 1080 canvas, aligned with the frame opening |

## PhotoTransform

| Field | Type | Rules |
|---|---|---|
| source | File/ImageBitmap | local image only |
| x | number | bounded by interaction, resettable |
| y | number | bounded by interaction, resettable |
| zoom | number | 1.0–2.4, default 1.0 |

## ExportImage

| Field | Type | Rules |
|---|---|---|
| width | number | exactly 1080 |
| height | number | exactly 1080 |
| mimeType | string | `image/png` |
| filename | string | deterministic, no user data |

## Relationships

One selected `Frame` and one `PhotoTransform` produce one `ExportImage`. The photo
source is held in memory only for the current page session.
