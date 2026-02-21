import { memo, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { DOMPurify } from './richTextSanitizer';
import { addToast } from '../../../store/slices/toastSlice';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link as LinkIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Table as TableIcon,
  Rows,
  Columns,
  Trash2,
  Paintbrush,
} from 'lucide-react';

const fontFamilies = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
];

const fontSizes = [
  { label: 'Default', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
];

const RichTextMenuBar = memo(({ editor }) => {
  const { t } = useTranslation(['common']);
  const dispatch = useDispatch();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef(null);

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  if (!editor) return null;

  const addLink = () => {
    setLinkUrl('');
    setShowLinkInput(true);
  };

  const confirmLink = () => {
    if (linkUrl) {
      const sanitizedUrl = DOMPurify.sanitize(linkUrl);
      if (sanitizedUrl.match(/^(https?:|mailto:)/i)) {
        editor.chain().focus().setLink({ href: sanitizedUrl }).run();
      } else {
        dispatch(addToast({ message: t('common:rteInvalidUrl'), type: 'warning' }));
      }
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const cancelLink = () => {
    setShowLinkInput(false);
    setLinkUrl('');
    editor.chain().focus().run();
  };

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50 items-center">
      <select
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setFontFamily(e.target.value).run();
          } else {
            editor.chain().focus().unsetFontFamily().run();
          }
        }}
        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        title={t('common:rteFontFamily')}
      >
        {fontFamilies.map((font) => (
          <option key={font.value} value={font.value}>
            {font.label}
          </option>
        ))}
      </select>

      <select
        value={editor.getAttributes('textStyle').fontSize || ''}
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setFontSize(e.target.value).run();
          } else {
            editor.chain().focus().unsetFontSize().run();
          }
        }}
        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        title={t('common:rteFontSize')}
      >
        {fontSizes.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>

      <input
        type="color"
        value={editor.getAttributes('textStyle').color || '#000000'}
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        title={t('common:rteTextColor')}
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('bold') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteBold')}
      >
        <Bold size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('italic') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteItalic')}
      >
        <Italic size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('underline') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteUnderline')}
      >
        <UnderlineIcon size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('strike') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteStrikethrough')}
      >
        <Strikethrough size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('bulletList') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteBulletList')}
      >
        <List size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('orderedList') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteOrderedList')}
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('blockquote') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteBlockquote')}
      >
        <Quote size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('codeBlock') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteCodeBlock')}
      >
        <Code2 size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title={t('common:rteHorizontalRule')}
      >
        <Minus size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={addLink}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive('link') ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteInsertLink')}
      >
        <LinkIcon size={18} />
      </button>

      {showLinkInput && (
        <div className="flex items-center gap-1">
          <input
            ref={linkInputRef}
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); confirmLink(); }
              if (e.key === 'Escape') { cancelLink(); }
            }}
            placeholder="https://..."
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48"
          />
          <button type="button" onClick={confirmLink} className="px-2 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700">OK</button>
          <button type="button" onClick={cancelLink} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">X</button>
        </div>
      )}

      {editor.isActive('link') && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="p-1.5 rounded hover:bg-red-200 transition-colors text-red-600"
          title={t('common:rteRemoveLink')}
        >
          <LinkIcon size={18} className="line-through" />
        </button>
      )}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteAlignLeft')}
      >
        <AlignLeft size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteAlignCenter')}
      >
        <AlignCenter size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteAlignRight')}
      >
        <AlignRight size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive({ textAlign: 'justify' }) ? 'bg-cyan-200' : ''
        }`}
        title={t('common:rteJustify')}
      >
        <AlignJustify size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title={t('common:rteInsertTable')}
      >
        <TableIcon size={18} />
      </button>

      {editor.isActive('table') && (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-xs px-2"
            title={t('common:rteAddColumnBefore')}
          >
            ← Col
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-xs px-2"
            title={t('common:rteAddColumnAfter')}
          >
            Col →
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-1.5 rounded hover:bg-red-200 transition-colors text-red-600"
            title={t('common:rteDeleteColumn')}
          >
            <Columns size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-xs px-2"
            title={t('common:rteAddRowBefore')}
          >
            ↑ Riga
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors text-xs px-2"
            title={t('common:rteAddRowAfter')}
          >
            Riga ↓
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-1.5 rounded hover:bg-red-200 transition-colors text-red-600"
            title={t('common:rteDeleteRow')}
          >
            <Rows size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-1.5 rounded hover:bg-red-200 transition-colors text-red-600"
            title={t('common:rteDeleteTable')}
          >
            <Trash2 size={18} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex items-center gap-1">
            <Paintbrush size={14} className="text-gray-600" />
            <input
              type="color"
              value={
                editor.isActive('tableCell')
                  ? editor.getAttributes('tableCell').backgroundColor || '#ffffff'
                  : editor.isActive('tableHeader')
                  ? editor.getAttributes('tableHeader').backgroundColor || '#f3f4f6'
                  : '#ffffff'
              }
              onChange={(e) => {
                if (editor.isActive('tableCell')) {
                  editor.chain().focus().setCellBackgroundColor(e.target.value).run();
                } else if (editor.isActive('tableHeader')) {
                  editor.chain().focus().setHeaderBackgroundColor(e.target.value).run();
                }
              }}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              title={t('common:rteCellBgColor')}
            />
          </div>
        </>
      )}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={t('common:rteUndo')}
      >
        <Undo size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={t('common:rteRedo')}
      >
        <Redo size={18} />
      </button>
    </div>
  );
});

RichTextMenuBar.displayName = 'RichTextMenuBar';

export default RichTextMenuBar;
