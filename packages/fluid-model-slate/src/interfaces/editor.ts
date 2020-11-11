import { FluidElement } from './element';
import { FluidText } from './text';

type FluidEditor = {
  id: string;
  type: string;
  title: string;
  icon: string;
  children: FluidNode[];
  [key: string]: any;
};

type FluidNode = FluidEditor | FluidElement | FluidText;

/**
 *
 * {
 *    id: "12324",
 *    title: "这是title",
 *    icon: "这是icon",
 *    childrend: [
 *        {
 *            id: "12324",
 *            childrend: [
 *              {
 *                id:"xxx",
 *                text:"diyiduan"
 *              },
 *              {
 *                id:"xxx",
 *                text:"di2duan"
 *              },
 *              {
 *                id:"xxx",
 *                children:[
 *                  {
 *                     id:"xxx",
 *                     "bold":true
 *                     text:"di2"
 *                  }
 *                ]
 *              }
 *            ]
 *        }
 *
 *    ]
 * }
 *
 *
 */

enum FLUIDNODE_KEYS {
  ID = 'id',
  TYPE = 'type',
  CHILDREN = 'children',
  TEXT = 'text',
  TITALIC = 'titalic',
  TITLE = 'title',
  ICON = 'icon',
  PROPERTIES = 'properties',
}

export { FluidEditor, FluidNode, FLUIDNODE_KEYS };
