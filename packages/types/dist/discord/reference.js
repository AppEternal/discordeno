/** Types for: https://discord.com/developers/docs/reference */ /**
 * https://discord.com/developers/docs/reference#image-formatting
 *
 * @remarks
 * json is only for stickers
 */ /** https://discord.com/developers/docs/reference#locales */ export var Locales = /*#__PURE__*/ function(Locales) {
    Locales["Indonesian"] = "id";
    Locales["Danish"] = "da";
    Locales["German"] = "de";
    Locales["EnglishUk"] = "en-GB";
    Locales["EnglishUs"] = "en-US";
    Locales["Spanish"] = "es-ES";
    Locales["SpanishLatam"] = "es-419";
    Locales["French"] = "fr";
    Locales["Croatian"] = "hr";
    Locales["Italian"] = "it";
    Locales["Lithuanian"] = "lt";
    Locales["Hungarian"] = "hu";
    Locales["Dutch"] = "nl";
    Locales["Norwegian"] = "no";
    Locales["Polish"] = "pl";
    Locales["PortugueseBrazilian"] = "pt-BR";
    Locales["RomanianRomania"] = "ro";
    Locales["Finnish"] = "fi";
    Locales["Swedish"] = "sv-SE";
    Locales["Vietnamese"] = "vi";
    Locales["Turkish"] = "tr";
    Locales["Czech"] = "cs";
    Locales["Greek"] = "el";
    Locales["Bulgarian"] = "bg";
    Locales["Russian"] = "ru";
    Locales["Ukrainian"] = "uk";
    Locales["Hindi"] = "hi";
    Locales["Thai"] = "th";
    Locales["ChineseChina"] = "zh-CN";
    Locales["Japanese"] = "ja";
    Locales["ChineseTaiwan"] = "zh-TW";
    Locales["Korean"] = "ko";
    return Locales;
}({});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kaXNjb3JkL3JlZmVyZW5jZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogVHlwZXMgZm9yOiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZWZlcmVuY2UgKi9cblxuLyoqXG4gKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZWZlcmVuY2UjaW1hZ2UtZm9ybWF0dGluZ1xuICpcbiAqIEByZW1hcmtzXG4gKiBqc29uIGlzIG9ubHkgZm9yIHN0aWNrZXJzXG4gKi9cbmV4cG9ydCB0eXBlIEltYWdlRm9ybWF0ID0gJ2pwZycgfCAnanBlZycgfCAncG5nJyB8ICd3ZWJwJyB8ICdnaWYnIHwgJ2F2aWYnIHwgJ2pzb24nXG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZWZlcmVuY2UjaW1hZ2UtZm9ybWF0dGluZyAqL1xuZXhwb3J0IHR5cGUgSW1hZ2VTaXplID0gMTYgfCAzMiB8IDY0IHwgMTI4IHwgMjU2IHwgNTEyIHwgMTAyNCB8IDIwNDggfCA0MDk2XG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZWZlcmVuY2UjbG9jYWxlcyAqL1xuZXhwb3J0IGVudW0gTG9jYWxlcyB7XG4gIEluZG9uZXNpYW4gPSAnaWQnLFxuICBEYW5pc2ggPSAnZGEnLFxuICBHZXJtYW4gPSAnZGUnLFxuICBFbmdsaXNoVWsgPSAnZW4tR0InLFxuICBFbmdsaXNoVXMgPSAnZW4tVVMnLFxuICBTcGFuaXNoID0gJ2VzLUVTJyxcbiAgU3BhbmlzaExhdGFtID0gJ2VzLTQxOScsXG4gIEZyZW5jaCA9ICdmcicsXG4gIENyb2F0aWFuID0gJ2hyJyxcbiAgSXRhbGlhbiA9ICdpdCcsXG4gIExpdGh1YW5pYW4gPSAnbHQnLFxuICBIdW5nYXJpYW4gPSAnaHUnLFxuICBEdXRjaCA9ICdubCcsXG4gIE5vcndlZ2lhbiA9ICdubycsXG4gIFBvbGlzaCA9ICdwbCcsXG4gIFBvcnR1Z3Vlc2VCcmF6aWxpYW4gPSAncHQtQlInLFxuICBSb21hbmlhblJvbWFuaWEgPSAncm8nLFxuICBGaW5uaXNoID0gJ2ZpJyxcbiAgU3dlZGlzaCA9ICdzdi1TRScsXG4gIFZpZXRuYW1lc2UgPSAndmknLFxuICBUdXJraXNoID0gJ3RyJyxcbiAgQ3plY2ggPSAnY3MnLFxuICBHcmVlayA9ICdlbCcsXG4gIEJ1bGdhcmlhbiA9ICdiZycsXG4gIFJ1c3NpYW4gPSAncnUnLFxuICBVa3JhaW5pYW4gPSAndWsnLFxuICBIaW5kaSA9ICdoaScsXG4gIFRoYWkgPSAndGgnLFxuICBDaGluZXNlQ2hpbmEgPSAnemgtQ04nLFxuICBKYXBhbmVzZSA9ICdqYScsXG4gIENoaW5lc2VUYWl3YW4gPSAnemgtVFcnLFxuICBLb3JlYW4gPSAna28nLFxufVxuXG5leHBvcnQgdHlwZSBMb2NhbGl6YXRpb24gPSBQYXJ0aWFsPFJlY29yZDxMb2NhbGVzLCBzdHJpbmc+PlxuIl0sIm5hbWVzIjpbIkxvY2FsZXMiXSwibWFwcGluZ3MiOiJBQUFBLDZEQUE2RCxHQUU3RDs7Ozs7Q0FLQyxHQU1ELDBEQUEwRCxHQUMxRCxPQUFPLElBQUEsQUFBS0EsaUNBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FBQUE7TUFpQ1gifQ==