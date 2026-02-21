import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor } from '@tiptap/react';
import { sanitizeTiptapContent } from './richtext/richTextSanitizer';
import { buildExtensions, EDITOR_PROSE_CLASS } from './richtext/richTextExtensions';
import RichTextContent from './richtext/RichTextContent';

const RichTextEditor = ({
  value,
  onChange,
  docKey,
  placeholder,
  error,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common']);
  const resolvedPlaceholder = placeholder || t('common:rteWriteHere');
  const initialContent = useMemo(() => sanitizeTiptapContent(value) || null, []);

  const isApplyingExternalContent = useRef(false);
  const lastAppliedDocKey = useRef(null);

  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: buildExtensions(resolvedPlaceholder),
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: EDITOR_PROSE_CLASS,
      },
    },
    onUpdate: ({ editor }) => {
      if (isApplyingExternalContent.current) return;

      const json = editor.isEmpty ? null : editor.getJSON();
      onChange(json);
    },
    onSelectionUpdate: () => {
      forceUpdate(prev => prev + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const docKeyChanged = lastAppliedDocKey.current !== docKey;
    const editorIsEmpty = editor.isEmpty;
    const valueIsAvailable = value !== null && value !== undefined;

    if (docKeyChanged || (editorIsEmpty && valueIsAvailable)) {
      lastAppliedDocKey.current = docKey;

      isApplyingExternalContent.current = true;

      const sanitizedContent = sanitizeTiptapContent(value);

      editor.commands.setContent(sanitizedContent || null, { emitUpdate: false });

      isApplyingExternalContent.current = false;
    }
  }, [editor, docKey, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return (
    <RichTextContent
      editor={editor}
      error={error}
      readOnly={readOnly}
    />
  );
};

export default RichTextEditor;
