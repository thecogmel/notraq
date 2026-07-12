import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#52525b"
      className={cn(
        'flex w-full min-w-0 flex-row items-center rounded-[14px] border border-zinc-800 bg-[#18181b] px-3.5 py-3 font-sans text-sm leading-5 text-white',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'outline-none transition-[color,box-shadow] selection:bg-primary placeholder:text-[#52525b] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-[#52525b]',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };
