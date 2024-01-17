import polyfill from "../packages/excalidraw/polyfill";
import LanguageDetector from "i18next-browser-languagedetector";
import { useEffect, useRef } from "react";

import { TopErrorBoundary } from "./components/TopErrorBoundary";

import { useCallbackRefState } from "../packages/excalidraw/hooks/useCallbackRefState";

import { Excalidraw, defaultLang } from "../packages/excalidraw/index";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "../packages/excalidraw/types";
import {
  ResolvablePromise,
  resolvablePromise,
} from "../packages/excalidraw/utils";

import { CollabAPI } from "./collab/Collab";

import clsx from "clsx";

import { atom, Provider } from "jotai";

import { appJotaiStore } from "./app-jotai";

import "./index.scss";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

const languageDetector = new LanguageDetector();

languageDetector.init({
  languageUtils: {},
});

const detectedLangCode = languageDetector.detect() || defaultLang.code;

export const appLangCodeAtom = atom(
  Array.isArray(detectedLangCode) ? detectedLangCode[0] : detectedLangCode,
);

const initializeScene = async (opts: {
  collabAPI: CollabAPI | null;
  excalidrawAPI: ExcalidrawImperativeAPI;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { isExternalScene: true; id: string; key: string }
    | { isExternalScene: false; id?: null; key?: null }
  )
> => {
  return {
    scene: {
      appState: {
        isLoading: false,
      },
      elements: [],
    },
    isExternalScene: true,
    id: "roomLinkData.roomId",
    key: "roomLinkData.roomKey",
  };
};

const ExcalidrawWrapper = () => {
  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    initializeScene({ collabAPI: null, excalidrawAPI }).then(async (data) => {
      initialStatePromiseRef.current.promise.resolve(data.scene);
    });
  }, [excalidrawAPI]);

  return (
    <div
      style={{ height: "100%" }}
      className={clsx("excalidraw-app", {
        "is-collaborating": false,
      })}
    >
      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        initialData={initialStatePromiseRef.current.promise}
      ></Excalidraw>
    </div>
  );
};

const ExcalidrawApp = () => {
  return (
    <TopErrorBoundary>
      <Provider unstable_createStore={() => appJotaiStore}>
        <ExcalidrawWrapper />
      </Provider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
