import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import BoldExtension from '@tiptap/extension-bold';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

const CustomTableCell = TableCell.extend({
  name: 'tableCell',

  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('colwidth');
          return width ? [parseInt(width, 10)] : null;
        },
        renderHTML: attributes => {
          if (!attributes.colwidth) {
            return {};
          }
          return {
            colwidth: attributes.colwidth,
            style: `width: ${attributes.colwidth}px`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCellBackgroundColor: (color) => ({ commands }) => {
        return commands.updateAttributes('tableCell', { backgroundColor: color });
      },
      unsetCellBackgroundColor: () => ({ commands }) => {
        return commands.updateAttributes('tableCell', { backgroundColor: null });
      },
      setCellWidth: (width) => ({ commands }) => {
        return commands.updateAttributes('tableCell', { colwidth: width });
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  name: 'tableHeader',

  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('colwidth');
          return width ? [parseInt(width, 10)] : null;
        },
        renderHTML: attributes => {
          if (!attributes.colwidth) {
            return {};
          }
          return {
            colwidth: attributes.colwidth,
            style: `width: ${attributes.colwidth}px`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setHeaderBackgroundColor: (color) => ({ commands }) => {
        return commands.updateAttributes('tableHeader', { backgroundColor: color });
      },
      unsetHeaderBackgroundColor: () => ({ commands }) => {
        return commands.updateAttributes('tableHeader', { backgroundColor: null });
      },
    };
  },
});

const buildExtensions = (resolvedPlaceholder) => [
  StarterKit.configure({
    bold: false,
    link: false,
    underline: false,
  }),
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  BoldExtension,
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-cyan-600 underline hover:text-cyan-800',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph', 'listItem'],
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full',
    },
  }),
  TableRow,
  CustomTableHeader,
  CustomTableCell,
  Placeholder.configure({ placeholder: resolvedPlaceholder }),
];

const EDITOR_PROSE_CLASS =
  'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3 ' +
  '[&_p]:my-1 [&_p]:leading-normal ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 ' +
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 ' +
  '[&_li]:text-gray-900 [&_li]:my-0 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:my-2 ' +
  '[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-700 ' +
  '[&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-2 ' +
  '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm ' +
  '[&_hr]:my-4 [&_hr]:border-gray-300 [&_a]:text-cyan-600 [&_a]:underline ' +
  '[&_table]:border-collapse [&_table]:table-auto [&_table]:w-full [&_table]:my-4 ' +
  '[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold ' +
  '[&_td]:border [&_td]:border-gray-300 [&_td]:p-2 ' +
  '[&_td.selectedCell]:bg-cyan-100 [&_th.selectedCell]:bg-cyan-200';

export { buildExtensions, EDITOR_PROSE_CLASS };
