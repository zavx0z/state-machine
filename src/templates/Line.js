const svg = String.raw
/**
 * @param {string} id
 * @param {string} path
 * @returns {string}
 */
export default (id, path) => svg`
<g data-active="false" class="line" id="${id}">
  <defs>
    <marker id="marker-${id}" viewBox="0 0 10 10" markerWidth="5" markerHeight="5" refX="0" refY="5" markerUnits="strokeWidth" orient="auto">
      <path d="M0,0 L0,10 L10,5 z" />
    </marker>
  </defs>
  <path d="${path}" stroke-width="2" fill="none" marker-end="url(#marker-${id})" opacity="1"/>
</g>
`
