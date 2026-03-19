import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";

interface MyViewProps extends SafeAreaViewProps {
  className?: string;
}

const MyView = ({ children, className, ...rest }: MyViewProps) => {
  const defaultClasses = "flex-1 bg-white";
  const combinedClassName = className 
    ? `${defaultClasses} ${className}`.trim() 
    : defaultClasses;

  return (
    <SafeAreaView className={combinedClassName} {...rest} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
};

export default MyView;
