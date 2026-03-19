import { ReactNode } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Text, TextInput, TextInputProps, View, Platform } from "react-native";

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  rightIcon?: ReactNode;
  inputClassName?: string;
} & Omit<TextInputProps, "className">;

export default function CustomInput<T extends FieldValues>({
  control,
  name,
  rightIcon,
  inputClassName = "",
  ...props
}: CustomInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
        <View className="gap-2 w-full">
          <View className="relative w-full">
            <TextInput
              {...props}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              className={
                `px-4 py-3 border rounded-xl w-full bg-gray-50 text-base text-gray-900 ${inputClassName} ` +
                (error
                  ? " border-red-500"
                  : "border-gray-200 focus:border-blue-500")
              }
              style={{
                paddingRight: rightIcon ? 43 : 16,
                height: 56, // Altura fija para consistencia
                lineHeight: Platform.OS === "ios" ? 0 : undefined, // Centrar texto en iOS
              }}
            />
            {rightIcon && (
              <View
                className="absolute right-0 top-0 bottom-0 justify-center pr-3"
                pointerEvents="box-none"
              >
                {rightIcon}
              </View>
            )}
          </View>
          {error?.message && (
            <Text className="text-red-500 text-sm mt-1">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}
