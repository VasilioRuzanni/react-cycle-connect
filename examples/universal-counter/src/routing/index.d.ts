// https://stackoverflow.com/questions/44851502/relative-import-of-platform-specific-ios-android-typescript-files-for-react-nati
// This file exists for two purposes:
// 1. Ensure that both ios and android files present identical types to importers.
// 2. Allow consumers to import the module as if typescript understood react-native suffixes.
// import DefaultNative from "./index.native";
import * as native from "./index.native";
// import DefaultWeb from "./index.web";
import * as web from "./index.web";

declare var _test: typeof native;
declare var _test: typeof web;

// declare var _testDefault: typeof DefaultNative;
// declare var _testDefault: typeof DefaultWeb;

export * from "./index.native";
