import { Machine, forwardTo, sendParent } from 'xstate'

import createMainRenderingMachine from './Main/createMainRenderingMachine'
import createLayersRenderingMachine from './Layers/createLayersRenderingMachine'
import createImagesRenderingMachine from './Images/createImagesRenderingMachine'

const createRenderingMachine = (options, context) => {
  const { main, layers, images } = options
  const mainMachine = createMainRenderingMachine(main, context)
  const layersMachine = createLayersRenderingMachine(layers, context)
  const imagesMachine = createImagesRenderingMachine(images, context)
  return Machine(
    {
      id: 'rendering',
      initial: 'idle',
      context,
      states: {
        idle: {
          always: {
            target: 'active',
            actions: ['createRenderer'],
          },
        },
        active: {
          invoke: [
            {
              id: 'main',
              src: mainMachine,
            },
            {
              id: 'layers',
              src: layersMachine,
            },
            {
              id: 'images',
              src: imagesMachine,
            },
          ],
          on: {
            BACKGROUND_TURNED_LIGHT: {
              actions: sendParent('TOGGLE_DARK_MODE'),
            },
            BACKGROUND_TURNED_DARK: {
              actions: sendParent('TOGGLE_DARK_MODE'),
            },
            RENDER: {
              actions: 'render',
            },
            SET_BACKGROUND_COLOR: {
              actions: forwardTo('main'),
            },
            TOGGLE_BACKGROUND_COLOR: {
              actions: forwardTo('main'),
            },
            SET_UNITS: {
              actions: forwardTo('main'),
            },
            TAKE_SCREENSHOT: {
              actions: forwardTo('main'),
            },
            TOGGLE_ROTATE: {
              actions: forwardTo('main'),
            },
            TOGGLE_ANNOTATIONS: {
              actions: forwardTo('main'),
            },
            TOGGLE_AXES: {
              actions: forwardTo('main'),
            },
            TOGGLE_INTERPOLATION: {
              actions: forwardTo('main'),
            },
            VIEW_MODE_CHANGED: {
              actions: forwardTo('main'),
            },
            RESET_CAMERA: {
              actions: forwardTo('main'),
            },
          },
        },
      },
    },
    options
  )
}

export default createRenderingMachine
