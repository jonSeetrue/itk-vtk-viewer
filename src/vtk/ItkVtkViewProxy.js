import macro from 'vtk.js/Sources/macro'

import vtkViewProxy from 'vtk.js/Sources/Proxy/Core/ViewProxy'
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate'
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math'
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData'
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox'
import vtkAxesLabelsWidget from './AxesLabelsWidget'
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager'

const CursorCornerAnnotation =
  '<table class="corner-annotation" style="margin-left: 0;"><tr><td style="margin-left: auto; margin-right: 0;">Index:</td><td>${iIndex},</td><td>${jIndex},</td><td>${kIndex}</td></tr><tr><td style="margin-left: auto; margin-right: 0;">Position:</td><td>${xPosition},</td><td>${yPosition},</td><td>${zPosition}</td></tr><tr><td style="margin-left: auto; margin-right: 0;"">Value:</td><td style="text-align:center;" colspan="3">${value}</td></tr><tr ${annotationLabelStyle}><td style="margin-left: auto; margin-right: 0;">Label:</td><td style="text-align:center;" colspan="3">${annotation}</td></tr></table>'

const { vtkErrorMacro } = macro

function numberToText(number, precision) {
  let text = Number.parseFloat(number).toPrecision(precision)
  if (number > 1) {
    text = Number.parseInt(Number.parseFloat(text))
  }
  return text
}

// ----------------------------------------------------------------------------
// ItkVtkViewProxy methods
// ----------------------------------------------------------------------------

function ItkVtkViewProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('ItkVtkViewProxy')

  // Private --------------------------------------------------------------------
  //
  function updateAxesVisibility() {
    if (!!!model.axesOriginWidget) {
      return
    }
    if (!model.enableAxes) {
      model.axesGridActor.setVisibility(false)
      model.axesOriginWidget.setVisibility(false)
      model.axesXWidget.setVisibility(false)
      model.axesXActor.setVisibility(false)
      model.axesYWidget.setVisibility(false)
      model.axesYActor.setVisibility(false)
      model.axesZWidget.setVisibility(false)
      model.axesZActor.setVisibility(false)
      return
    }

    model.axesOriginWidget.setVisibility(true)
    switch (model.viewMode) {
      case 'XPlane':
        model.axesGridActor.setVisibility(false)
        model.axesOriginHandle.setText(model.axesOriginXText)
        model.axesYHandle.setText(model.axesYXText)
        model.axesZHandle.setText(model.axesZXText)
        model.axesXWidget.setVisibility(false)
        model.axesXActor.setVisibility(false)
        model.axesYWidget.setVisibility(true)
        model.axesYActor.setVisibility(true)
        model.axesZWidget.setVisibility(true)
        model.axesZActor.setVisibility(true)
        break
      case 'YPlane':
        model.axesGridActor.setVisibility(false)
        model.axesOriginHandle.setText(model.axesOriginYText)
        model.axesXHandle.setText(model.axesXYText)
        model.axesZHandle.setText(model.axesZYText)
        model.axesXWidget.setVisibility(true)
        model.axesXActor.setVisibility(true)
        model.axesYWidget.setVisibility(false)
        model.axesYActor.setVisibility(false)
        model.axesZWidget.setVisibility(true)
        model.axesZActor.setVisibility(true)
        break
      case 'ZPlane':
        model.axesGridActor.setVisibility(false)
        model.axesOriginHandle.setText(model.axesOriginZText)
        model.axesXHandle.setText(model.axesXZText)
        model.axesYHandle.setText(model.axesYZText)
        model.axesXWidget.setVisibility(true)
        model.axesXActor.setVisibility(true)
        model.axesYWidget.setVisibility(true)
        model.axesYActor.setVisibility(true)
        model.axesZWidget.setVisibility(false)
        model.axesZActor.setVisibility(false)
        break
      case 'VolumeRendering':
        model.axesGridActor.setVisibility(true)
        model.axesOriginHandle.setText(model.axesOriginVText)
        model.axesXHandle.setText(model.axesXVText)
        model.axesYHandle.setText(model.axesYVText)
        model.axesZHandle.setText(model.axesZVText)
        model.axesXWidget.setVisibility(true)
        model.axesXActor.setVisibility(true)
        model.axesYWidget.setVisibility(true)
        model.axesYActor.setVisibility(true)
        model.axesZWidget.setVisibility(true)
        model.axesZActor.setVisibility(true)
        break
      default:
        vtkErrorMacro('Unexpected view mode')
    }
  }

  function setVisualizationMode(axisIndex) {
    if (model.enableAxes) {
      updateAxesVisibility()
    }

    // volume rendering
    if (axisIndex === -1) {
      model.interactor.setInteractorStyle(model.interactorStyle3D)
      if (model.rotate && !!!model.rotateAnimationCallback) {
        model.rotateAnimationCallback = model.interactor.onAnimation(
          rotateAzimuth
        )
        model.interactor.requestAnimation('itk-vtk-view-rotate')
      }
      if (model.volumeRenderingCameraState) {
        model.camera.setFocalPoint(
          ...model.volumeRenderingCameraState.focalPoint
        )
        model.camera.setPosition(...model.volumeRenderingCameraState.position)
        model.camera.setViewUp(...model.volumeRenderingCameraState.viewUp)
        model.camera.setViewAngle(model.volumeRenderingCameraState.viewAngle)
        model.camera.setParallelScale(
          model.volumeRenderingCameraState.parallelScale
        )
        model.camera.setPhysicalTranslation(
          ...model.volumeRenderingCameraState.physicalTranslation
        )
      }
      model.camera.setParallelProjection(false)
      if (model.volumeRepresentation) {
        if (model.viewPlanes) {
          publicAPI.setCornerAnnotation('se', model.seCornerAnnotation)
        } else {
          publicAPI.setCornerAnnotation('se', '')
        }
        model.volumeRepresentation.setSliceVisibility(model.viewPlanes)
        model.volumeRepresentation.setVolumeVisibility(true)
      }
    } else {
      model.camera.setParallelProjection(true)
      publicAPI.setCornerAnnotation('se', model.seCornerAnnotation)
      model.interactor.setInteractorStyle(model.interactorStyle2D)
      if (model.rotate && !!model.rotateAnimationCallback) {
        model.interactor.cancelAnimation('itk-vtk-view-rotate')
        model.rotateAnimationCallback.unsubscribe()
        model.rotateAnimationCallback = null
      }
      if (model.volumeRepresentation) {
        model.volumeRepresentation.setVolumeVisibility(false)
        model.volumeRepresentation.getActors().forEach((actor, index) => {
          if (index === axisIndex) {
            actor.setVisibility(true)
          } else {
            actor.setVisibility(false)
          }
        })
      }
      switch (axisIndex) {
        case 0:
          publicAPI.updateOrientation(0, 1, [0, 0, 1])
          break
        case 1:
          publicAPI.updateOrientation(1, -1, [0, 0, 1])
          break
        case 2:
          publicAPI.updateOrientation(2, -1, [0, -1, 0])
          break
        default:
          vtkErrorMacro('Unexpected view mode')
      }
    }
  }

  function getAnnotationText(value) {
    const labelValue = value[model.labelIndex]
    if (model.labelNames !== null && model.labelNames.has(labelValue)) {
      return model.labelNames.get(labelValue)
    }
    return labelValue
  }

  function getAnnotationLabelStyle() {
    return model.labelIndex === null ? 'style="display: none;"' : ''
  }

  function updateAnnotations(callData) {
    const renderPosition = callData.position
    model.annotationPicker.pick(
      [renderPosition.x, renderPosition.y, 0.0],
      callData.pokedRenderer
    )
    const ijk = model.annotationPicker.getPointIJK()
    if (model.volumeRepresentation) {
      publicAPI.setCornerAnnotation('se', model.seCornerAnnotation)
      const imageData = model.volumeRepresentation.getInputDataSet()
      const size = imageData.getDimensions()
      const scalarData = imageData.getPointData().getScalars()
      const fusedValue = scalarData.getTuple(
        size[0] * size[1] * ijk[2] + size[0] * ijk[1] + ijk[0]
      )
      const annotation = getAnnotationText(fusedValue)
      const worldPositions = model.annotationPicker.getPickedPositions()
      if (ijk.length > 0 && worldPositions.length > 0) {
        const worldPosition = worldPositions[0]
        model.dataProbeCubeSource.setCenter(worldPosition)
        model.dataProbeActor.setVisibility(true)
        model.dataProbeFrameActor.setVisibility(true)
        model.lastPickedValues = {
          iIndex: ijk[0],
          jIndex: ijk[1],
          kIndex: ijk[2],
          xPosition: String(worldPosition[0]).substring(0, 4),
          yPosition: String(worldPosition[1]).substring(0, 4),
          zPosition: String(worldPosition[2]).substring(0, 4),
          value:
            model.labelIndex === null
              ? fusedValue
              : fusedValue.slice(0, model.labelIndex),
          label:
            model.labelIndex === null ? null : fusedValue[model.labelIndex],
          annotation,
          annotationLabelStyle: getAnnotationLabelStyle(),
        }
        publicAPI.updateCornerAnnotation(model.lastPickedValues)
      } else {
        publicAPI.setCornerAnnotation('se', '')
        model.dataProbeActor.setVisibility(false)
        model.dataProbeFrameActor.setVisibility(false)
        model.lastPickedValues = null
      }
    } else {
      model.lastPickedValues = null
    }
  }

  function updateAxes() {
    model.axesBoundingBox.reset()
    model.representations.forEach(representation => {
      model.axesBoundingBox.addBounds(...representation.getBounds())
    })
    const minPoint = model.axesBoundingBox.getMinPoint()
    const maxPoint = model.axesBoundingBox.getMaxPoint()
    const axisTicks = model.numberOfAxisTicks
    const xDelta = (maxPoint[0] - minPoint[0]) / (axisTicks - 1)
    const yDelta = (maxPoint[1] - minPoint[1]) / (axisTicks - 1)
    const zDelta = (maxPoint[2] - minPoint[2]) / (axisTicks - 1)

    const axesPoints = new Float32Array(axisTicks * axisTicks * 3 * 3)
    let offset = 0
    // x-y plane
    for (let i = 0; i < axisTicks; i++) {
      for (let j = 0; j < axisTicks; j++) {
        axesPoints[offset] = minPoint[0] + i * xDelta
        axesPoints[offset + 1] = minPoint[1] + j * yDelta
        axesPoints[offset + 2] = minPoint[2]
        offset += 3
      }
    }
    // y-z plane
    for (let i = 0; i < axisTicks; i++) {
      for (let j = 0; j < axisTicks; j++) {
        axesPoints[offset] = minPoint[0]
        axesPoints[offset + 1] = minPoint[1] + i * yDelta
        axesPoints[offset + 2] = minPoint[2] + j * zDelta
        offset += 3
      }
    }
    // x-z plane
    for (let i = 0; i < axisTicks; i++) {
      for (let j = 0; j < axisTicks; j++) {
        axesPoints[offset] = minPoint[0] + i * xDelta
        axesPoints[offset + 1] = minPoint[1]
        axesPoints[offset + 2] = minPoint[2] + j * zDelta
        offset += 3
      }
    }

    function addLines(linesArray, offset, axisTicks) {
      for (let i = 0; i < axisTicks - 1; i++) {
        for (let j = 0; j < axisTicks - 1; j++) {
          const start = i * axisTicks + j + offset
          linesArray = linesArray.concat([
            5,
            start,
            start + 1,
            (i + 1) * axisTicks + j + 1 + offset,
            (i + 1) * axisTicks + j + offset,
            start,
          ])
        }
      }
      return linesArray
    }

    let axesLines = []
    // x-y plane
    offset = 0
    axesLines = addLines(axesLines, offset, axisTicks)
    // y-z plane
    offset += axisTicks * axisTicks
    axesLines = addLines(axesLines, offset, axisTicks)
    // x-z plane
    offset += axisTicks * axisTicks
    axesLines = addLines(axesLines, offset, axisTicks)

    const verts = new Uint32Array(axesPoints.length)
    verts.fill(1)
    for (let i = 0; i < axesPoints.length; i++) {
      verts[i * 2 + 1] = i
    }
    model.axesPolyData.getPoints().setData(axesPoints, 3)
    model.axesPolyData.getVerts().setData(verts)
    model.axesPolyData.getLines().setData(new Uint32Array(axesLines))

    const minPointText = minPoint.map(point => numberToText(point, 2))
    const maxPointText = maxPoint.map(point => numberToText(point, 2))
    model.axesOriginHandle.setOrigin(minPoint)
    model.axesOriginXText = `Origin: ${minPointText[1]}, ${minPointText[2]}`
    model.axesOriginYText = `Origin: ${minPointText[0]}, ${minPointText[2]}`
    model.axesOriginZText = `Origin: ${minPointText[0]}, ${minPointText[1]}`
    model.axesOriginVText = `Origin: ${minPointText[0]}, ${minPointText[1]}, ${minPointText[2]}`
    model.axesOriginHandle.setText(model.axesOriginVText)

    model.axesXOriginHandle.setOrigin(minPoint)
    model.axesXOriginHandle.setText('')
    model.axesXHandle.setOrigin([maxPoint[0], minPoint[1], minPoint[2]])
    model.axesXYText = `X, Z: ${maxPointText[0]}, ${minPointText[2]}`
    model.axesXZText = `X, Y: ${maxPointText[0]}, ${minPointText[1]}`
    model.axesXVText = `X: ${maxPointText[0]}, ${minPointText[1]}, ${minPointText[2]}`
    model.axesXHandle.setText(model.axesXVText)

    model.axesYOriginHandle.setOrigin(minPoint)
    model.axesYOriginHandle.setText('')
    model.axesYHandle.setOrigin([minPoint[0], maxPoint[1], minPoint[2]])
    model.axesYXText = `Y, Z: ${maxPointText[1]}, ${minPointText[2]}`
    model.axesYZText = `X, Y: ${minPointText[0]}, ${maxPointText[1]}`
    model.axesYVText = `Y: ${minPointText[0]}, ${maxPointText[1]}, ${minPointText[2]}`
    model.axesYHandle.setText(model.axesYVText)

    model.axesZOriginHandle.setOrigin(minPoint)
    model.axesZOriginHandle.setText('')
    model.axesZHandle.setOrigin([minPoint[0], minPoint[1], maxPoint[2]])
    model.axesZXText = `Y, Z: ${minPointText[1]}, ${maxPointText[2]}`
    model.axesZYText = `X, Z: ${minPointText[0]}, ${maxPointText[2]}`
    model.axesZVText = `Z: ${minPointText[0]}, ${minPointText[1]}, ${maxPointText[2]}`
    model.axesZHandle.setText(model.axesZVText)
  }

  // Setup --------------------------------------------------------------------

  publicAPI.setCornerAnnotation('se', '')
  publicAPI.updateCornerAnnotation({
    iIndex: '&nbsp;N/A',
    jIndex: '&nbsp;N/A',
    kIndex: '&nbsp;N/A',
    xPosition: '&nbsp;N/A',
    yPosition: '&nbsp;N/A',
    zPosition: '&nbsp;N/A',
    value: 'N/A&nbsp;',
    annotation: 'N/A&nbsp;',
    annotationLabelStyle: getAnnotationLabelStyle(),
  })
  publicAPI.setAnnotationOpacity(0.0)
  model.annotationPicker = vtkPointPicker.newInstance()
  model.annotationPicker.setPickFromList(1)
  model.annotationPicker.initializePickList()
  model.interactor.onLeftButtonPress(event => {
    if (model.clickCallback && model.lastPickedValues) {
      model.clickCallback(model.lastPickedValues)
    }
  })
  model.interactor.onMouseMove(event => {
    updateAnnotations(event)
  })
  model.interactor.onStartMouseMove(event => {
    if (model.viewMode !== 'VolumeRendering' || model.viewPlanes) {
      publicAPI.getInteractor().requestAnimation('annotationMouseMove')
    }
  })
  model.interactor.onEndMouseMove(event => {
    if (model.viewMode !== 'VolumeRendering' || model.viewPlanes) {
      publicAPI.getInteractor().cancelAnimation('annotationMouseMove')
    }
  })
  model.interactor.onEndMouseWheel(event => {
    updateDataProbeSize()
  })

  // use the same color map in the planes
  // colormap changes with window / level
  // window / level changes piecewise =jk

  model.dataProbeCubeSource = vtkCubeSource.newInstance()
  model.dataProbeMapper = vtkMapper.newInstance()
  model.dataProbeMapper.setInputConnection(
    model.dataProbeCubeSource.getOutputPort()
  )
  model.dataProbeActor = vtkActor.newInstance()
  model.dataProbeActor.setMapper(model.dataProbeMapper)
  model.dataProbeFrameActor = vtkActor.newInstance()
  model.dataProbeFrameActor.setMapper(model.dataProbeMapper)
  model.renderer.addActor(model.dataProbeActor)
  const dataProbeProperty = model.dataProbeActor.getProperty()
  dataProbeProperty.setLighting(false)
  dataProbeProperty.setColor(1.0, 1.0, 1.0)
  const dataProbeFrameProperty = model.dataProbeFrameActor.getProperty()
  dataProbeFrameProperty.setRepresentation(1)
  dataProbeFrameProperty.setColor(0.0, 0.0, 0.0)
  model.renderer.addActor(model.dataProbeFrameActor)
  model.dataProbeActor.setVisibility(false)
  model.dataProbeFrameActor.setVisibility(false)

  function updateDataProbeSize() {
    if (model.volumeRepresentation) {
      const image = model.volumeRepresentation.getInputDataSet()
      const spacing = image.getSpacing()
      let viewableScale = null
      if (model.camera.getParallelProjection()) {
        viewableScale = model.camera.getParallelScale() / 40
      } else {
        const distance = model.camera.getDistance()
        // Heuristic assuming a constant view angle
        viewableScale = distance / 150
      }
      model.dataProbeCubeSource.setXLength(Math.max(spacing[0], viewableScale))
      model.dataProbeCubeSource.setYLength(Math.max(spacing[1], viewableScale))
      model.dataProbeCubeSource.setZLength(Math.max(spacing[2], viewableScale))
    }
  }

  model.camera.pitch(-30.0)
  model.camera.azimuth(30.0)

  model.orientationWidget.setViewportSize(0.1)
  const superRenderLater = publicAPI.renderLater
  publicAPI.renderLater = () => {
    superRenderLater()
    if (!model.widgetManagerInitialized) {
      // Needs to come after initial render
      model.widgetManager.setRenderer(model.renderer)
      model.widgetManager.disablePicking()
      model.axesOriginWidget = model.widgetManager.addWidget(
        model.axesOriginLabel
      )
      model.axesXWidget = model.widgetManager.addWidget(model.axesXLabels)
      model.axesYWidget = model.widgetManager.addWidget(model.axesYLabels)
      model.axesZWidget = model.widgetManager.addWidget(model.axesZLabels)
      const color =
        model.axesGridActor.getProperty().getColor()[0] === 0.0
          ? 'black'
          : 'white'
      model.axesOriginWidget.setCircleProps({
        r: model.axesCircleRadius,
        stroke: color,
        fill: color,
      })
      model.axesOriginWidget.setTextProps({
        fill: color,
        dx: -10 * model.axesTextOffset,
        dy: 2 * model.axesTextOffset,
      })
      model.axesXWidget.setCircleProps({
        r: model.axesCircleRadius,
        stroke: color,
        fill: color,
      })
      model.axesXWidget.setTextProps({
        fill: color,
        dx: model.axesTextOffset,
        dy: 2 * model.axesTextOffset,
      })
      model.axesYWidget.setCircleProps({
        r: model.axesCircleRadius,
        stroke: color,
        fill: color,
      })
      model.axesYWidget.setTextProps({
        fill: color,
        dx: model.axesTextOffset,
        dy: 2 * model.axesTextOffset,
      })
      model.axesZWidget.setCircleProps({
        r: model.axesCircleRadius,
        stroke: color,
        fill: color,
      })
      model.axesZWidget.setTextProps({
        fill: color,
        dx: model.axesTextOffset,
        dy: -1 * model.axesTextOffset,
      })
      let widgetState = model.axesOriginLabel.getWidgetState()
      model.axesOriginHandle = widgetState.addHandle()
      widgetState = model.axesXLabels.getWidgetState()
      model.axesXOriginHandle = widgetState.addHandle()
      model.axesXHandle = widgetState.addHandle()
      model.axesXActor = model.axesXWidget
        .getRepresentations()[1]
        .getActors()[0]
      const rgbColor = model.axesGridActor.getProperty().getColor()
      model.axesXActor.getProperty().setColor(...rgbColor)
      widgetState = model.axesYLabels.getWidgetState()
      model.axesYOriginHandle = widgetState.addHandle()
      model.axesYHandle = widgetState.addHandle()
      model.axesYActor = model.axesYWidget
        .getRepresentations()[1]
        .getActors()[0]
      model.axesYActor.getProperty().setColor(...rgbColor)
      widgetState = model.axesZLabels.getWidgetState()
      model.axesZOriginHandle = widgetState.addHandle()
      model.axesZHandle = widgetState.addHandle()
      model.axesZActor = model.axesZWidget
        .getRepresentations()[1]
        .getActors()[0]
      model.axesZActor.getProperty().setColor(...rgbColor)
      model.widgetManagerInitialized = true

      updateAxes()
      updateAxesVisibility()
    }
    updateScaleBar()
  }

  model.scaleBarCanvas = document.createElement('canvas')
  model.scaleBarCanvas.style.position = 'absolute'
  model.scaleBarCanvas.style.left = '50%'
  model.scaleBarCanvas.style.bottom = '15.0%'
  model.scaleBarCanvas.style.width = '100px'
  model.scaleBarCanvas.style.height = '30px'
  model.scaleBarCanvas.width = 100 * window.devicePixelRatio
  model.scaleBarCanvas.height = 30 * window.devicePixelRatio
  model.scaleBarCenterCoord = vtkCoordinate.newInstance()
  model.scaleBarCenterCoord.setRenderer(model.renderer)
  model.scaleBarCenterCoord.setCoordinateSystemToNormalizedViewport()
  model.scaleBarCenterCoord.setValue(0.5, 0.5)
  model.scaleBarCoordWidth = vtkCoordinate.newInstance()
  model.scaleBarCoordWidth.setReferenceCoordinate(model.scaleBarCenterCoord)
  model.scaleBarCoordWidth.setCoordinateSystemToViewport()
  model.scaleBarCoordWidth.setRenderer(model.renderer)
  model.scaleBarCoordWidth.setValue(model.scaleBarCanvas.width, 0)
  function updateScaleBar() {
    const devicePixelRatio = window.devicePixelRatio || 1
    const scaleBarCtx = model.scaleBarCanvas.getContext('2d')

    const dims = {
      width: model.scaleBarCanvas.clientWidth * devicePixelRatio,
      height: model.scaleBarCanvas.clientHeight * devicePixelRatio,
    }

    scaleBarCtx.clearRect(0, 0, dims.width, dims.height)
    scaleBarCtx.fillStyle = model.cornerAnnotation.getAnnotationContainer().style.color
    scaleBarCtx.fillRect(0, 0, dims.width, 2 * devicePixelRatio)

    scaleBarCtx.font = `${16 * devicePixelRatio}px arial`
    scaleBarCtx.textAlign = 'center'
    scaleBarCtx.textBaseline = 'top'
    model.scaleBarCoordWidth.setValue(dims.width, 0)
    const cw = model.scaleBarCoordWidth.getComputedWorldValue()
    const cc = model.scaleBarCenterCoord.getComputedWorldValue()
    const length = Math.sqrt(
      (cw[0] - cc[0]) * (cw[0] - cc[0]) + (cw[1] - cc[1]) * (cw[1] - cc[1]),
      (cw[2] - cc[2]) * (cw[2] - cc[2])
    )
    model.lengthPixelRatio = length / dims.width
    const text = numberToText(length, 1)
    scaleBarCtx.fillText(
      `${text} ${model.units}`,
      dims.width * 0.5,
      6 * devicePixelRatio,
      dims.width * 0.9
    )
  }
  model.interactor.onEndMouseWheel(updateScaleBar)
  model.interactor.onEndPinch(updateScaleBar)

  model.axesPolyData = vtkPolyData.newInstance()
  model.axesMapper = vtkMapper.newInstance()
  model.axesMapper.setInputData(model.axesPolyData)
  model.axesGridActor = vtkActor.newInstance()
  model.axesGridActor.setMapper(model.axesMapper)
  model.axesGridActor.getProperty().setOpacity(0.5)
  model.axesGridActor.setVisibility(false)
  model.renderer.addActor(model.axesGridActor)
  model.numberOfAxisTicks = 7
  model.axesBoundingBox = vtkBoundingBox.newInstance()
  model.widgetManagerInitialized = false
  model.widgetManager = vtkWidgetManager.newInstance()
  model.axesOriginLabel = vtkAxesLabelsWidget.newInstance()
  model.axesXLabels = vtkAxesLabelsWidget.newInstance()
  model.axesYLabels = vtkAxesLabelsWidget.newInstance()
  model.axesZLabels = vtkAxesLabelsWidget.newInstance()
  model.axesCircleRadius = 4
  model.axesTextOffset = 14

  // API ----------------------------------------------------------------------
  publicAPI.updateDataProbeSize = updateDataProbeSize
  publicAPI.updateScaleBar = updateScaleBar

  const superSetBackground = publicAPI.setBackground
  publicAPI.setBackground = color => {
    superSetBackground(color)
    if (color[0] + color[1] + color[2] <= 1.5) {
      model.axesGridActor.getProperty().setColor([1.0, 1.0, 1.0])
      if (model.widgetManagerInitialized) {
        model.axesXActor.getProperty().setColor(1.0, 1.0, 1.0)
        model.axesOriginWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'white',
          fill: 'white',
        })
        model.axesOriginWidget.setTextProps({
          fill: 'white',
          dx: -10 * model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesXWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'white',
          fill: 'white',
        })
        model.axesXWidget.setTextProps({
          fill: 'white',
          dx: model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesYActor.getProperty().setColor(1.0, 1.0, 1.0)
        model.axesYWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'white',
          fill: 'white',
        })
        model.axesYWidget.setTextProps({
          fill: 'white',
          dx: model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesZActor.getProperty().setColor(1.0, 1.0, 1.0)
        model.axesZWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'white',
          fill: 'white',
        })
        model.axesZWidget.setTextProps({
          fill: 'white',
          dx: model.axesTextOffset,
          dy: -1 * model.axesTextOffset,
        })
      }
    } else {
      model.axesGridActor.getProperty().setColor([0.0, 0.0, 0.0])
      if (model.widgetManagerInitialized) {
        model.axesXActor.getProperty().setColor(0.0, 0.0, 0.0)
        model.axesOriginWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'black',
          fill: 'black',
        })
        model.axesOriginWidget.setTextProps({
          fill: 'black',
          dx: -10 * model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesXWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'black',
          fill: 'black',
        })
        model.axesXWidget.setTextProps({
          fill: 'black',
          dx: model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesYActor.getProperty().setColor(0.0, 0.0, 0.0)
        model.axesYWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'black',
          fill: 'black',
        })
        model.axesYWidget.setTextProps({
          fill: 'black',
          dx: model.axesTextOffset,
          dy: 2 * model.axesTextOffset,
        })
        model.axesZActor.getProperty().setColor(0.0, 0.0, 0.0)
        model.axesZWidget.setCircleProps({
          r: model.axesCircleRadius,
          stroke: 'black',
          fill: 'black',
        })
        model.axesZWidget.setTextProps({
          fill: 'black',
          dx: model.axesTextOffset,
          dy: -1 * model.axesTextOffset,
        })
      }
    }
  }

  publicAPI.setViewMode = mode => {
    if (model.viewMode === 'VolumeRendering') {
      model.volumeRenderingCameraState = model.camera.getState()
    }
    switch (mode) {
      case 'XPlane':
        if (model.viewMode === 'XPlane') {
          break
        }
        model.viewMode = mode
        model.axesZWidget.setVisibility(false)
        model.axesZActor.setVisibility(false)
        setVisualizationMode(0)
        break
      case 'YPlane':
        if (model.viewMode === 'YPlane') {
          break
        }
        model.viewMode = mode
        setVisualizationMode(1)
        break
      case 'ZPlane':
        if (model.viewMode === 'ZPlane') {
          break
        }
        model.viewMode = mode
        setVisualizationMode(2)
        break
      case 'VolumeRendering':
        if (model.viewMode === 'VolumeRendering') {
          break
        }
        model.viewMode = mode
        setVisualizationMode(-1)
        break
      default:
        vtkErrorMacro('Unexpected view mode')
    }
    publicAPI.resetCamera()
    updateDataProbeSize()
  }

  publicAPI.setViewPlanes = viewPlanes => {
    model.viewPlanes = viewPlanes
    if (model.viewMode === 'VolumeRendering' && model.volumeRepresentation) {
      model.volumeRepresentation.setSliceVisibility(viewPlanes)
      if (viewPlanes) {
        publicAPI.setCornerAnnotation('se', model.seCornerAnnotation)
      }
      model.renderWindow.render()
    }
  }

  publicAPI.setOrientationAnnotationVisibility = visible => {
    if (visible) {
      model.scaleBarCanvas.style.display = 'block'
      if (model.volumeRepresentation) {
        publicAPI.setAnnotationOpacity(1.0)
        model.orientationWidget.setEnabled(true)
        model.renderWindow.render()
      }
    } else {
      model.scaleBarCanvas.style.display = 'none'
      publicAPI.setAnnotationOpacity(0.0)
      model.orientationWidget.setEnabled(false)
      model.renderWindow.render()
    }
  }

  publicAPI.setPlanesUseLinearInterpolation = interpolate => {
    if (model.volumeRepresentation) {
      if (interpolate) {
        model.volumeRepresentation.getActors().forEach(actor => {
          actor.getProperty().setInterpolationTypeToLinear()
          actor
            .getProperty()
            .getRGBTransferFunction()
            .modified()
        })
        model.renderWindow.render()
      } else {
        model.volumeRepresentation.getActors().forEach(actor => {
          actor.getProperty().setInterpolationTypeToNearest()
          actor
            .getProperty()
            .getRGBTransferFunction()
            .modified()
        })
        model.renderWindow.render()
      }
    }
  }

  publicAPI.setEnableAxes = enable => {
    if (enable != model.enableAxes) {
      model.enableAxes = enable
      updateAxesVisibility()
      publicAPI.modified()
      publicAPI.renderLater()
    }
  }

  const superAddRepresentation = publicAPI.addRepresentation
  publicAPI.addRepresentation = representation => {
    superAddRepresentation(representation)

    if (!representation) {
      return
    }

    const volumeRepresentations = model.representations.filter(rep => {
      const isVolumeRepresentation = !!rep.getVolumes().length
      return isVolumeRepresentation
    })
    if (volumeRepresentations[0]) {
      model.volumeRepresentation = volumeRepresentations[0]
      const volume = model.volumeRepresentation.getVolumes()[0]
      const property = volume.getProperty()
      property.setAmbient(0.4)
      property.setDiffuse(1.0)
      property.setSpecular(0.4)
      property.setSpecularPower(25)
      model.volumeRepresentation
        .getActors()
        .forEach(model.annotationPicker.addPickList)
      updateDataProbeSize()
      publicAPI.setAnnotationOpacity(1.0)
    }

    if (model.widgetManagerInitialized) {
      updateAxes()
    }
  }

  const superRemoveRepresentation = publicAPI.removeRepresentation
  publicAPI.removeRepresentation = representation => {
    superRemoveRepresentation(representation)

    if (!representation) {
      return
    }
    representation.getActors().forEach(model.annotationPicker.deletePickList)
  }

  // Continuously rotate in 3D
  function rotateAzimuth() {
    model.renderer.getActiveCamera().azimuth(0.25)
    model.renderer.resetCameraClippingRange()
  }
  model.rotateAnimationCallback = null
  publicAPI.setRotate = rotate => {
    if (model.rotate === rotate) {
      return
    }
    model.rotate = rotate

    if (rotate) {
      model.rotateAnimationCallback = model.interactor.onAnimation(
        rotateAzimuth
      )
      model.interactor.requestAnimation('itk-vtk-view-rotate')
    } else {
      model.interactor.cancelAnimation('itk-vtk-view-rotate')
      if (!!model.rotateAnimationCallback) {
        model.rotateAnimationCallback.unsubscribe()
        model.rotateAnimationCallback = null
      }
    }
  }

  const superSetContainer = publicAPI.setContainer
  publicAPI.setContainer = container => {
    superSetContainer(container)
    if (container) {
      container.appendChild(model.scaleBarCanvas)
    }
  }

  const superResize = publicAPI.resize
  publicAPI.resize = () => {
    if (model.container) {
      const dims = model.container.getBoundingClientRect()
      if (dims.width === dims.height && dims.width === 0) {
        return
      }
      const devicePixelRatio = window.devicePixelRatio || 1
      const width = Math.max(10, Math.floor(devicePixelRatio * dims.width))
      const height = Math.max(10, Math.floor(devicePixelRatio * dims.height))
      model.openglRenderWindow.setSize(width, height)

      model.scaleBarCanvas.width = (100 * devicePixelRatio).toFixed()
      model.scaleBarCanvas.height = (30 * devicePixelRatio).toFixed()

      publicAPI.invokeResize({ width, height })
      publicAPI.renderLater()
    }
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  viewMode: 'VolumeRendering',
  viewPlanes: false,
  rotate: false,
  units: '',
  seCornerAnnotation: CursorCornerAnnotation,
  labelIndex: null,
  labelNames: null,
  clickCallback: null,
  lengthPixelRatio: 1.0,
  lastPickedValues: {
    iIndex: null,
    jIndex: null,
    kIndex: null,
    xPosition: null,
    yPosition: null,
    zPosition: null,
    value: null,
    label: null,
  },
  enableAxes: false,
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues)

  vtkViewProxy.extend(publicAPI, model, initialValues)
  macro.get(publicAPI, model, [
    'viewMode',
    'viewPlanes',
    'rotate',
    'lengthPixelRatio',
    'axesActor',
    'enableAxes',
  ])

  macro.setGet(publicAPI, model, [
    'units',
    'seCornerAnnotation',
    'labelNames',
    'labelIndex',
    'clickCallback',
  ])

  // Object specific methods
  ItkVtkViewProxy(publicAPI, model)
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'ItkVtkViewProxy')

// ----------------------------------------------------------------------------

export default { newInstance, extend }