# Bouquet collection

Eight user-supplied photos were edited with the built-in imagegen tool. Final web assets are in `public/images/collection/`. Product names and source prices come from the eight Florarium links supplied by the owner. Every displayed selling price is exactly 30% above its supplied source price.

The landing page displays all eight cards without requiring authentication. For the account store, run `supabase/collection.sql` after the existing schema/catalog setup. Products are initially inactive so supplier availability and exact flower composition can be checked before accepting orders. Existing prices and activation status are preserved when re-importing. No live database was configured during this change.

`data/collection.json` is the shared collection metadata. After editing it, run `node scripts/build-collection.mjs` to refresh the SQL import. Mixed-bouquet freshness metadata requires florist verification before activation.

## Base editing prompt

Edit the provided bouquet photo into a photorealistic luxury floral ecommerce product photograph. Preserve the exact flower species, colors, relative number/fullness, buds, foliage and existing wrapping of THIS bouquet. Remove the original setting and any hands/person/car. Stage the bouquet resting naturally on a warm ivory limestone tabletop against a softly textured warm ivory plaster wall, subtle horizon, diffuse daylight from upper left, soft realistic contact shadows, neutral true-to-life color, crisp botanical detail. Consistent premium studio collection: portrait 4:5 composition, entire bouquet visible, centered, occupies 78% of frame with comfortable margins, camera slightly above flower heads so the blooms are visible. Reorient only enough to present it beautifully. No vase, extra flowers, props, lettering, logo, or watermark. Do not make the bouquet fuller or change the product. Output one finished photograph, not a collage.

## Consistency correction

Use the source bouquet as the product and the completed Cherries photo as the studio reference. Replace the background with the reference's warm ivory limestone tabletop and ivory plaster wall. Match soft light from upper left. Present the complete bouquet upright, centered in a portrait 4:5 frame with comfortable margins. Keep the product's flowers, colors, fullness and wrapping. Do not copy the reference bouquet. No extra flowers, props, vases, people or text. For the unwrapped rose/peony bouquets, preserve the large rounded silhouette and natural stems.

## Sources

- ალუბლები — https://florarium.ge/product/cherries
- ყოველდღიური — https://florarium.ge/product/baby-pink-510020
- უმიზეზოდ — https://florarium.ge/product/simple
- გულისცემა — https://florarium.ge/product/heartbeat
- ბაღი — https://florarium.ge/product/garden
- სიყვარულის ბაღი — https://florarium.ge/product/garden-of-love
- აბრეშუმი — https://florarium.ge/product/silk
- 100 ვარდი — https://florarium.ge/product/100-roses
