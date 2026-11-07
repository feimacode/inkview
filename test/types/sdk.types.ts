/**
 * Compile-time checks for the SDK's generated declarations. `tsc` fails when an
 * expected error is missing (an unused `@ts-expect-error` is itself an error) or
 * a valid call stops typechecking.
 */
import {
  inkviewToolMeta,
  registerInkview,
  showMap,
  showProfileCard,
  showTable,
} from "@feimacode/inkview-sdk";

showProfileCard({ name: "Ada Lovelace", highlights: ["Mathematician"] });
// @ts-expect-error the person name must be a string
showProfileCard({ name: 42 });
// @ts-expect-error highlights must be strings
showProfileCard({ name: "Ada", highlights: [1] });

showTable({ columns: [{ key: "city", label: "City" }], rows: [{ city: "Oslo" }] });
// @ts-expect-error rows must be an array
showTable({ columns: [{ key: "city", label: "City" }], rows: { city: "Oslo" } });

showMap({ places: [{ label: "Oslo", lat: 59.91, lng: 10.75 }] });
// @ts-expect-error latitude must be a number
showMap({ places: [{ label: "Oslo", lat: "59.91", lng: 10.75 }] });

inkviewToolMeta({ component: "map" });
// @ts-expect-error unknown component ids are rejected
inkviewToolMeta({ component: "not_a_component" });

// @ts-expect-error the server must satisfy McpServer
registerInkview({});
