import { EditorContent } from '@tiptap/react';
import RichTextMenuBar from './RichTextMenuBar';

const PROSEMIRROR_STYLES = `
  .ProseMirror .column-resize-handle {
    position: absolute;
    right: -2px;
    top: 0;
    bottom: -2px;
    width: 4px;
    background-color: #adf;
    pointer-events: none;
    z-index: 20;
  }

  .ProseMirror.resize-cursor {
    cursor: col-resize;
  }

  .ProseMirror .tableWrapper {
    overflow-x: auto;
    margin: 1rem 0;
  }

  .ProseMirror table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    overflow: hidden;
  }

  .ProseMirror td,
  .ProseMirror th {
    vertical-align: top;
    box-sizing: border-box;
    position: relative;
  }

  .ProseMirror .selectedCell:after {
    z-index: 2;
    position: absolute;
    content: "";
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(200, 200, 255, 0.4);
    pointer-events: none;
  }
`;

const RichTextContent = ({ editor, error, readOnly }) => {
  return (
    <>
      <style>{PROSEMIRROR_STYLES}</style>
      <div className={`border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg overflow-hidden ${readOnly ? 'bg-gray-50' : 'bg-white'}`}>
        {!readOnly && <RichTextMenuBar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </>
  );
};

export default RichTextContent;
