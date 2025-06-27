"use client";

import { useRef, type ChangeEvent, type ComponentProps, type Ref } from "react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
};

type InputAsProp = { as?: "input" } & Omit<
  ComponentProps<typeof Input>,
  "onChange" | "value"
>;
type TextareaAsProp = { as: "textarea" } & Omit<
  ComponentProps<typeof Textarea>,
  "onChange" | "value"
>;

type EmojiPickerProps = BaseProps & (InputAsProp | TextareaAsProp);

export function EmojiPickerInput(props: EmojiPickerProps) {
  const { value, onChange } = props;
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const emojiCategories = [
    {
      name: "Popular",
      emojis: [
        "😀",
        "😂",
        "❤️",
        "👍",
        "🔥",
        "🎉",
        "😊",
        "🥰",
        "🤔",
        "🤯",
        "💯",
        "🙏",
        "😎",
        "😢",
        "😮",
        "🤢",
        "👏",
        "🙌",
        "🤷",
        "🚀",
        "💡",
        "💰",
        "✅",
        "❌",
      ],
    },
    {
      name: "Smileys",
      emojis: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "☺️",
        "😚",
        "😙",
        "🥲",
        "😋",
        "😛",
        "😜",
        "🤪",
        "😝",
        "🤑",
        "🤗",
        "🤭",
        "🤫",
        "🤔",
        "🤐",
        "🤨",
        "😐",
        "😑",
        "😶",
        "😏",
        "😒",
        "🙄",
        "😬",
        "🤥",
        "😌",
        "😔",
        "😪",
        "🤤",
        "😴",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🤧",
        "🥵",
        "🥶",
        "🥴",
        "😵",
        "🤯",
        "🤠",
        "🥳",
        "😎",
        "😢",
        "😮",
        "🔥",
        "🎉",
        "💯",
      ],
    },
    {
      name: "People",
      emojis: [
        "👋",
        "🤚",
        "🖐️",
        "✋",
        "🖖",
        "👌",
        "🤌",
        "🤏",
        "✌️",
        "🤞",
        "🤟",
        "🤘",
        "🤙",
        "👈",
        "👉",
        "👆",
        "🖕",
        "👇",
        "☝️",
        "👍",
        "👎",
        "✊",
        "👊",
        "🤛",
        "🤜",
        "👏",
        "🙌",
        "👐",
        "🤲",
        "🤝",
        "🙏",
        "✍️",
        "💅",
        "🤳",
        "💪",
        "🦾",
        "🦿",
        "🦵",
        "🦶",
        "👂",
        "🦻",
        "👃",
        "🧠",
        "👀",
        "👁️",
        "👅",
        "👄",
        "💋",
        "🩸",
        "🦷",
      ],
    },
    {
      name: "Animals",
      emojis: [
        "🐶",
        "🐱",
        "🐭",
        "🐹",
        "🐰",
        "🦊",
        "🐻",
        "🐼",
        "🐻‍❄️",
        "🐨",
        "🐯",
        "🦁",
        "🐮",
        "🐷",
        "🐽",
        "🐸",
        "🐵",
        "🙈",
        "🙉",
        "🙊",
        "🐒",
        "🐔",
        "🐧",
        "🐦",
        "🐤",
        "🐣",
        "🐥",
        "🦆",
        "🦅",
        "🦉",
        "🦇",
        "🐺",
        "🐗",
        "🐴",
        "🦄",
        "🐝",
        "🪱",
        "🐛",
        "🦋",
        "🐌",
        "🐞",
        "🐜",
        "🪰",
        "🪲",
        "🪳",
        "🦟",
        "🦗",
        "🕷️",
        "🕸️",
        "🦂",
      ],
    },
    {
      name: "Food",
      emojis: [
        "🍎",
        "🍐",
        "🍊",
        "🍋",
        "🍌",
        "🍉",
        "🍇",
        "🍓",
        "🫐",
        "🍈",
        "🍒",
        "🍑",
        "🥭",
        "🍍",
        "🥥",
        "🥝",
        "🍅",
        "🍆",
        "🥑",
        "🥦",
        "🥬",
        "🥒",
        "🌶️",
        "🫑",
        "🌽",
        "🥕",
        "🧄",
        "🧅",
        "🥔",
        "🍠",
        "🥐",
        "🥯",
        "🍞",
        "🥖",
        "🥨",
        "🧀",
        "🥚",
        "🍳",
        "🧈",
        "🥞",
        "🧇",
        "🥓",
        "🥩",
        "🍗",
        "🍖",
        "🦴",
        "🌭",
        "🍔",
        "🍟",
        "🍕",
      ],
    },
    {
      name: "Travel",
      emojis: [
        "🚗",
        "🚕",
        "🚙",
        "🚌",
        "🚎",
        "🏎️",
        "🚓",
        "🚑",
        "🚒",
        "🚐",
        "🛻",
        "🚚",
        "🚛",
        "🚜",
        "🛵",
        "🏍️",
        "🛺",
        "🚲",
        "🛴",
        "🛹",
        "🛼",
        "🚂",
        "🚆",
        "🚇",
        "🚊",
        "🚉",
        "✈️",
        "🛫",
        "🛬",
        "🛩️",
        "🛰️",
        "🚀",
        "🛸",
        "🚁",
        "🛶",
        "⛵",
        "🚤",
        "🛥️",
        "🛳️",
        "⛴️",
        "🚢",
        "⚓",
        "🪝",
        "⛽",
        "🚧",
        "🚦",
        "🚥",
        "🚏",
        "🗺️",
        "🗿",
      ],
    },
    {
      name: "Objects",
      emojis: [
        "⌚",
        "📱",
        "📲",
        "💻",
        "⌨️",
        "🖥️",
        "🖨️",
        "🖱️",
        "🖲️",
        "🕹️",
        "🗜️",
        "💽",
        "💾",
        "💿",
        "📀",
        "📼",
        "📷",
        "📸",
        "📹",
        "🎥",
        "📽️",
        "🎞️",
        "📞",
        "☎️",
        "📟",
        "📠",
        "📺",
        "📻",
        "🎙️",
        "🎚️",
        "🎛️",
        "🧭",
        "⏱️",
        "⏲️",
        "⏰",
        "🕰️",
        "⌛",
        "⏳",
        "📡",
        "🔋",
        "🔌",
        "💡",
        "🔦",
        "🕯️",
        "🪔",
        "🧯",
        "🛢️",
        "💸",
        "💵",
        "💴",
      ],
    },
    {
      name: "Symbols",
      emojis: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
        "☮️",
        "✝️",
        "☪️",
        "🕉️",
        "☸️",
        "✡️",
        "🔯",
        "🕎",
        "☯️",
        "☦️",
        "🛐",
        "⛎",
        "♈",
        "♉",
        "♊",
        "♋",
        "♌",
        "♍",
        "♎",
        "♏",
        "♐",
        "♑",
        "♒",
        "♓",
        "🆔",
        "⚛️",
        "🉑",
        "☢️",
        "☣️",
        "📴",
        "📳",
      ],
    },
  ];

  const handleEmojiClick = (emoji: string) => {
    const element = ref.current;
    if (element) {
      const start = element.selectionStart ?? 0;
      const end = element.selectionEnd ?? 0;
      const newText = value.substring(0, start) + emoji + value.substring(end);
      onChange(newText);

      // After the state update, focus the input and set the cursor position.
      // A timeout ensures the DOM has updated with the new text value.
      setTimeout(() => {
        element.focus();
        const newCursorPosition = start + emoji.length;
        element.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const popoverContent = (
    <PopoverContent className="w-64 p-0">
      <Tabs defaultValue={emojiCategories[0].name.toLowerCase()}>
        <TabsList className="w-full h-auto flex overflow-x-auto">
          {emojiCategories.map((category) => (
            <TabsTrigger
              key={category.name}
              value={category.name.toLowerCase()}
              className="flex-1 py-1 px-2 text-xs"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {emojiCategories.map((category) => (
          <TabsContent
            key={category.name}
            value={category.name.toLowerCase()}
            className="max-h-60 overflow-y-auto"
          >
            <div
              className="grid grid-cols-7 gap-1 p-2"
              role="grid"
              aria-label={`${category.name} emoji selection`}
            >
              {category.emojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-lg"
                  onClick={() => handleEmojiClick(emoji)}
                  aria-label={`Select emoji: ${emoji}`}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PopoverContent>
  );

  const popoverTrigger = (
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
        <Smile className="h-5 w-5 text-muted-foreground" />
        <span className="sr-only">Add emoji</span>
      </Button>
    </PopoverTrigger>
  );

  if (props.as === "textarea") {
    const { as, className, value, onChange, ...rest } = props;
    return (
      <div className="relative w-full">
        <Textarea
          ref={ref as unknown as Ref<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("pr-12", className)}
          {...rest}
        />
        <div className="absolute top-2 right-2">
          <Popover>
            {popoverTrigger}
            {popoverContent}
          </Popover>
        </div>
      </div>
    );
  }
}
