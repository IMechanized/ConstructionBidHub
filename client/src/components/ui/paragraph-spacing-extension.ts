import { Node } from '@tiptap/core';

export type LineHeight = 'normal' | 'relaxed' | 'loose';
export type ParagraphSpacing = 'tight' | 'normal' | 'wide';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setLineHeight: (lineHeight: LineHeight) => ReturnType;
      setParagraphSpacing: (spacing: ParagraphSpacing) => ReturnType;
    };
  }
}

export const ParagraphSpacingExtension = Node.create({
  name: 'paragraph',
  priority: 1000,
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      lineHeight: {
        default: 'normal',
        parseHTML: element => element.getAttribute('data-line-height') || 'normal',
        renderHTML: attributes => {
          if (!attributes.lineHeight || attributes.lineHeight === 'normal') {
            return {};
          }
          return {
            'data-line-height': attributes.lineHeight,
          };
        },
      },
      spacing: {
        default: 'normal',
        parseHTML: element => element.getAttribute('data-spacing') || 'normal',
        renderHTML: attributes => {
          if (!attributes.spacing || attributes.spacing === 'normal') {
            return {};
          }
          return {
            'data-spacing': attributes.spacing,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: LineHeight) => ({ commands }) => {
        return commands.updateAttributes('paragraph', { lineHeight });
      },
      setParagraphSpacing: (spacing: ParagraphSpacing) => ({ commands }) => {
        return commands.updateAttributes('paragraph', { spacing });
      },
    };
  },
});
