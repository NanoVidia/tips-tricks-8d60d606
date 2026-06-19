import { useMutation } from "@tanstack/react-query";

export const useParentNotifications = () =>
  useMutation({
    mutationFn: async (payload: { childId: string; message: string }) => payload,
  });
