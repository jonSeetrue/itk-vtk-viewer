import style from '../ItkVtkViewer.module.css';

import createGeometryColorChooser from './createGeometryColorChooser';
import createGeometryOpacitySlider from './createGeometryOpacitySlider';
import createGeometryColorPresetSelector from './createGeometryColorPresetSelector';
import createGeometryColorBySelector from './createGeometryColorBySelector';

function createGeometryColorWidget(
  viewerStore,
  geometriesUIGroup
) {
  const geometryColorByRow = document.createElement('div')
  geometryColorByRow.setAttribute('class', style.uiRow)
  geometryColorByRow.className += ` ${viewerStore.id}-toggle`;
  createGeometryColorBySelector(
    viewerStore,
    geometryColorByRow
  )
  geometriesUIGroup.appendChild(geometryColorByRow)

  const geometryColorRow = document.createElement('div')
  geometryColorRow.setAttribute('class', style.uiRow)
  geometryColorRow.className += ` ${viewerStore.id}-toggle`;

  createGeometryColorChooser(
    viewerStore,
    geometryHasScalars,
    geometrySelector,
    geometryColorRow
  )

  createGeometryOpacitySlider(
    viewerStore,
    geometryHasScalars,
    geometrySelector,
    geometryColorRow
  )
  geometriesUIGroup.appendChild(geometryColorRow)

  const geometryColorPresetRow = document.createElement('div')
  geometryColorPresetRow.setAttribute('class', style.uiRow)
  geometryColorPresetRow.className += ` ${viewerStore.id}-toggle`;
  createGeometryColorPresetSelector(
    viewerStore,
    geometryHasScalars,
    geometrySelector,
    geometryColorPresetRow
  )
  geometriesUIGroup.appendChild(geometryColorPresetRow)
}

export default createGeometryColorWidget;
