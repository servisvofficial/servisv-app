import { Text, View } from "react-native";
import type { RequestStatus } from "../interfaces/request.interface";

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "open":
        return {
          label: "Abierta",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
        };
      case "quoted":
        return {
          label: "Cotizada",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
        };
      case "accepted":
        return {
          label: "Aceptada",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
        };
      case "in_progress":
        return {
          label: "En progreso",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
        };
      case "completed":
        return {
          label: "Completada",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
        };
      case "cancelled":
        return {
          label: "Cancelada",
          bgColor: "bg-red-100",
          textColor: "text-red-800",
        };
      default:
        return {
          label: "Desconocido",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <Text className={`text-xs font-semibold ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
}
