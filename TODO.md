# TODO

Living backlog of known gaps and intentional stubs. Not urgent unless noted.

## Stubbed features (intentional, ship later)
- Items page: two import/export Excel buttons do nothing yet — intentionally stubbed, to be implemented later.
- Package page: "Export Excel" button does nothing yet — intentionally stubbed, to be implemented later.

## Theming
- `theme/tokens/default.ts` and `theme/tokens/dark.ts` are both filled in and match the
  `ThemeTokens` interface (including `success`/`successHover` colors and `shadow.sm`/`shadow.md`
  added for the green Import/Export buttons and card shadows). All new UI work should keep using
  tokens/CSS vars — never hardcode a color, shadow, or hex value in a component.
- Remaining pre-existing hardcoded values not yet tokenized: `#fff` used directly for text-on-color
  in several modals/forms, and `rgba(0,0,0,0.5)` used directly for modal backdrops (`ConfirmDialog`,
  `ImagePickerModal`, `BlueprintPickerModal`, `AddItemsToSaleModal`, `AddItemsToPackageModal`,
  `LoginForm`). Candidates for a `color.onPrimary` / `color.overlay` token if a full sweep is wanted.

## Filters
- Done: extracted `app/lib/hooks/useFilterParams.ts` — a shared hook (built on the existing
  `buildUrl` helper) providing `setParam`/`setParams`/`toggleInList`, plus a `useTransition`-backed
  `isPending` flag for "Searching..." indicators. `ItemFiltersBar` and `FilterSidebar` both use it
  now instead of each reimplementing `URLSearchParams` mutation.
- Fixed a real bug in the process: `app/page.tsx` passed `selectedCategoryIds`/`selectedTypeIds`
  (arrays) to `StorefrontHeader`, but `StorefrontHeader` forwarded them to `HeaderFilterDropdown` as
  singular `selectedCategoryId`/`selectedTypeId` and wrote **single-value** `categories`/`types`
  params — directly conflicting with `FilterSidebar`'s **multi-value**, comma-joined params on the
  same keys. Whichever UI was touched last would silently clobber the other's selection.
- Resolved by removing the header dropdowns entirely (`StorefrontHeader` is now just logo + login
  icon) rather than reconciling two UIs for the same filters — `FilterSidebar` already covers
  categories/types/statuses correctly. `FilterSidebar`'s checkboxes were also restyled to use the
  existing `FilterPill` component, matching `ItemFiltersBar`'s look.

## UI primitives
- Done: added `widgets/Card` (`Card.default.tsx` + `index.tsx`, same Tier-2 override pattern as
  `widgets/Button`) — a single component handling the shared card chrome (surface bg, border,
  radius, padding, overflow, optional Link-vs-div, optional `interactive` hover class). Refactored
  `ItemCard`, `PackageCard`, `SaleCard`, `PublicItemCard`, and `GalleryImageCard` to use it instead
  of duplicating inline chrome styles. Delete-button-as-sibling cards (`PackageCard`, `SaleCard`)
  still keep their own outer `position: relative` wrapper div around `<Card href=...>` +
  `DeleteXButton`, since a `<button>` can't validly nest inside the `<a>` that `Card` renders as a
  Link — `ItemCard` and `GalleryImageCard` instead pass `DeleteXButton` in as a Card child directly
  since their Card isn't a Link.

## Needs testing
- Modals (`ImagePickerModal`, `BlueprintPickerModal`, `AddItemsToPackageModal`,
  `AddItemsToSaleModal`, `ConfirmDialog`) have not been tested end-to-end. Verify behavior,
  especially focus handling and Escape-to-close, before relying on them.

## Sales
- `SaleCard` has a delete action (red X + confirm dialog, using the existing
  `DELETE /api/v1/sales/[id]` route and `deleteSale` service).
- Per `app/seed/route.ts`'s schema, `sales_items.sales_id` is `REFERENCES sales(id) ON DELETE CASCADE`,
  with no cascade into `items`. So deleting a sale removes the join rows but intentionally leaves
  the items' `status` as "sold" — that's the confirmed, correct behavior.
- `removeSaleItem` (`sales-items.ts`) now reverts an item's `status` back to 1 (available) when it's
  individually removed from a sale, matching the intended behavior — was previously only deleting
  the join row and leaving the item stuck "sold".

## Storage
- Done: added a `/dashboard/gallery` page (`GalleryGrid`/`GalleryImageCard`) listing every
  uploaded image newest-first, with a red X + confirm delete (using the existing
  `DELETE /api/v1/images/[id]` route, which already deletes both the Vercel Blob object and the
  DB row) and an upload button reusing the same client-side compression as the item form's image
  picker. Clicking an image opens `ImageZoomModal` (lightbox). Note: deleting an image here doesn't
  warn if it's still in use as an item's main image or gallery image — the DB just sets
  `main_image` to null / cascades the `item_images` join row (per `app/seed/route.ts`'s FK
  constraints), so it's non-destructive to the item itself, but there's no "used in N items"
  indicator before deleting. Worth adding if this becomes confusing in practice.

## Account & Security
- Password and email changing is completely unguarded right now. E-Mail field also does not make sense.