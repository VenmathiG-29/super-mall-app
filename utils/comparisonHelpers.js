// src/utils/comparisonHelpers.js
/**
 * Helpers for comparing products in detail.
 * Includes attribute-wise comparison, highlighting differences,
 * and structuring data for UI rendering.
 */

export function compareAttributes(products, keys) {
  // keys: list of product attribute keys to compare
  const comparison = {};
  keys.forEach(key => {
    const values = products.map(p => p[key] !== undefined ? p[key] : 'N/A');
    comparison[key] = {
      values,
      allEqual: values.every(v => v === values[0])
    };
  });
  return comparison;
}

export function getDifferenceHighlights(comparisonData) {
  // Return keys where not all values are equal (differentiators)
  return Object.entries(comparisonData)
    .filter(([_, data]) => !data.allEqual)
    .map(([key, _]) => key);
}

export function formatComparisonTable(products, attributes) {
  // attributes: array of attribute keys and labels
  let html = '<table class="comparison-table"><thead><tr><th>Feature</th>';
  products.forEach(p => {
    html += `<th>${p.name || 'Unknown'}</th>`;
  });
  html += '</tr></thead><tbody>';

  attributes.forEach(({ key, label }) => {
    const values = products.map(p => p[key] || 'N/A');
    const allEqual = values.every(v => v === values[0]);
    html += `<tr class="${allEqual ? 'equal-row' : 'diff-row'}"><th>${label}</th>`;
    values.forEach(value => {
      let displayVal = value;
      if (key === 'rating') displayVal = renderStars(value);
      html += `<td>${displayVal}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

export function renderStars(rating) {
  const ratingInt = Math.round(rating);
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= ratingInt ? '★' : '☆';
  }
  return `<span class="stars">${stars}</span>`;
}
