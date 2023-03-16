import type { FetchOptions } from "ofetch";
import useAuthSession from "./useAuthSession";
import useAuth from "./useAuth";
import { defu } from "defu";
import { $fetch } from "ofetch";
import type { NitroFetchRequest } from "nitropack";

export default async function <DataT>(
  request: NitroFetchRequest,
  options: FetchOptions<"json"> = {}
): Promise<DataT> {
  const { useAccessToken, refresh } = useAuthSession();

  const { logout } = useAuth();

  const accessToken = useAccessToken();

  await refresh();

  if (!accessToken.value) {
    await logout();
    throw new Error("unauthorized");
  }

  options.credentials = options.credentials || "omit";

  options.headers = defu(
    {
      Authorization: "Bearer " + accessToken.value,
    },
    options.headers
  );

  return $fetch<DataT>(request, options);
}
