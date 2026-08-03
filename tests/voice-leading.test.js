const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const html = fs.readFileSync("outputs/index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "index.html contains its inline application script");

function createHarness(initialChoices = {}, existingStorage = new Map(), midiNavigator = {}) {
  let now = 1000;
  let nextTimerId = 1;
  const timers = new Map();
  const timeouts = new Map();
  const storage = existingStorage;
  const documentListeners = {};
  const choices = {
    mode: "triad",
    timing: "10000",
    promptStyle: "both",
    difficulty: "guided",
    playDifficulty: "guided",
    ...initialChoices
  };

  class FakeElement {
    constructor(id, tagName = "DIV") {
      this.id = id;
      this.tagName = tagName;
      this.value = "";
      this.textContent = "";
      this.hidden = id === "appNavigation" || id === "areaLandingScreen" ||
        id === "setupScreen" || id === "practiceScreen" || id === "voiceScreen" || id === "playScreen" ||
        id === "fretboardScreen" || id === "keyStudyScreen" || id === "voiceSettings" ||
        id === "fretboardVoiceScreen" || id === "triadShapesScreen" || id === "playSettings" || id === "fretboardSettings" || id === "keyStudySettings" ||
        id === "fretboardVoiceSettings" || id === "fretboardVoiceDetail" ||
        id === "identifierScreen" || id === "favoritesScreen" || id === "identifierSettings" ||
        id === "saveChordPanel" || id === "favoriteDetail" ||
        id === "voiceProgressionSettings" || id === "voiceCommonProgression" ||
        id === "voiceRandomProgression" || id === "voiceProgressionContext" ||
        id === "voiceProgressionAssist" || id === "voiceProgressionSummary" ||
        id === "voiceProgressionCycleStatus" || id === "voiceProgressionShowNotesWrap" ||
        id === "voiceAnswer" || id === "playAnswer" || id === "playPromptDiagram" ||
        id === "playNamingAnswer" || id === "playKeyWrap" || id === "playSelectedRoots" ||
        id === "playSessionSummary" || id === "playThirdInversionOption" ||
        id === "playCustomSetBuilder" || id === "playCustomThirdInversionOption" ||
        id === "playSetProgress" || id === "playProgressionSettings" ||
        id === "playCustomProgressionBuilder" || id === "playProgressionPreview" ||
        id === "playProgressionReference" ||
        id === "triadShapesQuizPanel" || id === "triadShapesQuizQuestion" ||
        id === "triadShapesQuizSummary" || id === "triadShapesQuizNextButton" ||
        id === "fretboardVoiceStartingShapePicker" ||
        id === "shapeLibraryDetail" ||
        id === "fretboardSolution" || id === "nextExerciseButton" ||
        id === "voiceTargetContent";
      this.disabled = false;
      this.listeners = {};
      this.attributes = {};
      this.dataset = {};
      this.children = [];
      this.checked = false;
      this.style = {};
      this.className = "";
      this.classes = new Set();
      this.classList = {
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name)
      };
    }

    addEventListener(type, handler) {
      this.listeners[type] = handler;
    }

    dispatch(type, event = {}) {
      assert(this.listeners[type], `${this.id} has a ${type} listener`);
      this.listeners[type](event);
    }

    setAttribute(name, value) {
      this.attributes[name] = value;
    }

    focus() {
      document.activeElement = this;
    }

    replaceChildren() {
      this.children = [];
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }
  }

  const ids = [
    "appNavigation", "navHomeButton", "navAreaButton", "navToolSeparator", "navToolName",
    "fretboardAreaTabs", "navFretboardPractice", "navFretboardKeyStudy", "navFretboardVoiceLeading", "navFretboardTriadShapes",
    "homeScreen", "homeHeading", "homeKeyboardButton", "homeFretboardButton",
    "homeExploreButton", "continueSession", "continueSessionButton",
    "continueSessionContext", "areaLandingScreen", "areaLandingTitle",
    "areaLandingDescription", "keyboardRecognizeButton", "keyboardPlayButton",
    "keyboardVoiceButton", "fretboardVoiceLeadingButton", "fretboardTriadShapesButton", "fretboardPracticeButton", "fretboardKeyStudyButton",
    "exploreIdentifierButton", "exploreFavoritesButton",
    "setupScreen", "practiceScreen", "voiceScreen", "playScreen", "fretboardScreen",
    "keyStudyScreen", "fretboardVoiceScreen", "identifierScreen", "favoritesScreen",
    "title", "setupIntro", "triadSettings", "voiceSettings", "playSettings",
    "fretboardSettings", "keyStudySettings", "fretboardVoiceSettings", "identifierSettings", "midiSettings",
    "voiceKeySelect", "practiceKeySelect",
    "playKeySelect", "playPracticeKeySelect", "playPracticeKeyWrap", "fretboardKeySelect",
    "fretboardPracticeKeySelect", "keyStudyKeySelect", "fretboardVoiceKeySelect", "voiceHeaderLabel", "playHeaderLabel",
    "fretboardHeaderLabel", "fretboardSessionContext",
    "triadInput", "inputHint", "startButton", "itemLabel", "triadDisplay",
    "countdown", "pausedLabel", "pauseButton", "resumeButton", "nextButton", "restartButton",
    "voiceStartNotes", "voiceStartIdentity", "voiceStageOne", "voiceStageTwo",
    "voiceStageOneStatus", "voiceStageTwoLocked", "voiceTargetContent",
    "voiceTargetPrompt", "voiceTargetChordNotes", "revealButton", "voiceAnswer",
    "voiceAnswerEyebrow",
    "voiceTargetNotes", "voiceTargetIdentity", "voiceCommonTones", "voiceMovedNotes",
    "voiceMovementList", "voiceTotalMovement", "voiceTieResult",
    "voiceRouteAnalysisDetails", "voiceRouteAnalysisExplanation",
    "voiceRouteDiagnostics", "nextExerciseButton",
    "voiceRestartButton", "voiceSettingsButton", "voiceShowTargetNotes", "voiceRevealIncorrect",
    "voiceExerciseType", "voiceProgressionSettings", "voiceProgressionSource",
    "voiceProgressionGuidance", "voiceAssistLevel", "voiceChooseProgression",
    "voiceCommonProgression", "voiceRandomProgression", "voiceProgressionAddChord",
    "voiceProgressionAddButton", "voiceProgressionClearButton", "voiceProgressionSequence",
    "voiceCommonProgressionSelect", "voiceProgressionLength",
    "voiceProgressionAllowRepeats", "voiceProgressionDegreeI",
    "voiceProgressionDegreeIi", "voiceProgressionDegreeIii", "voiceProgressionDegreeIV",
    "voiceProgressionDegreeV", "voiceProgressionDegreeVi", "voiceProgressionSettingsHint",
    "voiceStageTwoTitle", "voiceProgressionContext", "voiceProgressionPosition",
    "voiceProgressionTrack", "voiceProgressionAssist", "voiceAssistCurrentBlock",
    "voiceAssistPlayBlock", "voiceAssistKeepBlock", "voiceAssistMoveBlock",
    "voiceAssistMovementBlock", "voiceAssistCurrent", "voiceAssistPlay",
    "voiceAssistKeep", "voiceAssistMove", "voiceAssistMovement",
    "voiceProgressionSummary", "voiceProgressionSummaryKey",
    "voiceProgressionSummaryPath", "voiceProgressionSummaryStats",
    "voiceProgressionMovementDetails", "voiceProgressionMovementList",
    "voiceProgressionCycleStatus", "voiceProgressionCycleMode",
    "voiceProgressionCycleCounter", "voiceProgressionCycleErrors",
    "voiceProgressionShowNotesWrap", "voiceProgressionShowNotes",
    "voiceProgressionPracticeCycleButton", "voiceProgressionReplayButton",
    "voiceProgressionTryAgainButton", "voiceProgressionNewButton",
    "voiceProgressionNoAssistButton",
    "playRoman", "playChordName", "playInversion", "playPromptType", "playPromptNotes",
    "playPromptDiagram", "playPromptKeyboardDiagram", "playNamingAnswer",
    "playAnswerRoot", "playAnswerChordType", "playAnswerInversion", "playSubmitAnswer",
    "playAnswer", "playAnswerNotes",
    "playAnswerConfirmation", "playKeyboardDiagram",
    "playResponse", "playRevealButton", "playNextButton", "playRestartButton",
    "playRevealIncorrect", "playShowRoman", "playResponseTimer", "playExactRegister",
    "playKeyboardDiagramLabels",
    "playPracticeType", "playIndividualSettings", "playProgressionSettings",
    "playProgressionKeySelect", "playProgressionSource", "playProgressionVoicingMethod",
    "playCommonProgressionControls", "playCommonProgressionSelect", "playCommonStartingInversion",
    "playProgressionEditor", "playCustomProgressionBuilder", "playProgressionAddHeading",
    "playProgressionStepEditor", "playProgressionRoot", "playProgressionChordType",
    "playProgressionInversionControl", "playProgressionInversion", "playProgressionAddButton", "playProgressionClearButton",
    "playProgressionListHeading", "playProgressionCount",
    "playProgressionSequence", "playProgressionShowHints", "playProgressionRepeat",
    "playProgressionHint", "playProgressionPreview", "playProgressionPreviewHeading",
    "playProgressionEditButton", "playProgressionPreviewStatus", "playProgressionPreviewList",
    "playProgressionStartButton", "playProgressionReference", "playPreviousVoicing",
    "playMovementHint",
    "playPracticeDirection", "playPoolMode", "playFilterPoolControls",
    "playRootMode", "playKeyWrap", "playSelectedRoots",
    "playSessionSummary", "playThirdInversionOption", "playInversionAny",
    "playCustomSetBuilder", "playCustomRoot", "playCustomChordType", "playCustomOrder",
    "playCustomRepeat", "playCustomInversionRoot", "playCustomInversionFirst",
    "playCustomInversionSecond", "playCustomInversionThird",
    "playCustomThirdInversionOption", "playCustomAddButton",
    "playCustomAllInversionsButton", "playCustomTriadInversionsButton",
    "playCustomRootOnlyButton", "playCustomClearChordButton", "playCustomKeySelect",
    "playCustomAddVisibleButton", "playCustomDiatonicList", "playCustomSummary",
    "playCustomSelectedList", "playCustomClearAllButton", "playCustomSetName",
    "playSavedSetSelect", "playSaveSetButton", "playLoadSetButton",
    "playRenameSetButton", "playDuplicateSetButton", "playDeleteSetButton",
    "playSavedSetMessage", "playSetProgress",
    "playRootC", "playRootDb", "playRootD", "playRootEb", "playRootE", "playRootF",
    "playRootFs", "playRootG", "playRootAb", "playRootA", "playRootBb", "playRootB",
    "playChordMajor", "playChordMinor", "playChordDiminished", "playChordAugmented",
    "playChordSus2", "playChordSus4", "playChordDominant7", "playChordMajor7",
    "playChordMinor7", "playChordMinorMajor7", "playChordHalfDiminished7",
    "playChordDiminished7", "playChordAdd9", "playChordMinorAdd9",
    "playChordSix", "playChordMinorSix", "playInversionRoot", "playInversionFirst",
    "playInversionSecond", "playInversionThird",
    "playCompleted", "playFirstAttempts", "playAverage", "playCurrentStreak",
    "playLongestStreak", "playSessionLength",
    "fretboardStringSet", "fretboardFretRange", "fretboardDotLabels",
    "fretboardIncludeOpen", "fretboardAutoAdvance", "fretboardResponseTimer",
    "fretboardChordName", "fretboardInversion", "fretboardPromptStringSet",
    "fretboardPromptNotes",
    "fretboardSolution", "fretboardSolutionIdentity", "fretboardSolutionNotes",
    "fretboardDiagram", "fretboardTab", "fretboardFeedback", "fretboardCompleted",
    "fretboardAverage", "fretboardCurrentStreak", "fretboardLongestStreak",
    "fretboardFavoriteSet", "fretboardFavoriteKey", "fretboardRevealButton",
    "fretboardNextButton", "fretboardRestartButton", "fretboardReturnStudyButton",
    "keyStudyStringSet", "keyStudyQuality", "keyStudyFretRange", "keyStudyOrdering",
    "keyStudyDotLabels", "keyStudyView", "keyStudyStrategy", "keyStudySequenceInversion",
    "keyStudyIncludeOpen", "keyStudyDegreeI", "keyStudyDegreeIi", "keyStudyDegreeIii",
    "keyStudyDegreeIV", "keyStudyDegreeV", "keyStudyDegreeVi", "keyStudyDegreeVii",
    "keyStudyInversionRoot", "keyStudyInversionFirst", "keyStudyInversionSecond",
    "keyStudyKeyContext", "keyStudyStringContext", "keyStudyReference",
    "keyStudyPreviousButton", "keyStudyPlayButton", "keyStudyNextButton",
    "keyStudyAutoAdvance", "keyStudyAdvanceDelay", "keyStudyBackButton",
    "keyStudyPracticeButton",
    "shapeLibraryRouteButton", "shapeLibraryViewButton", "shapeLibraryKeySelect",
    "shapeLibraryStringSet", "shapeLibraryFretRange", "shapeLibraryIncludeOpen",
    "shapeLibraryDetail", "shapeLibraryDetailTitle", "shapeLibraryDetailIdentity",
    "shapeLibraryDetailClose", "shapeLibraryDetailDiagram", "shapeLibraryDetailNotes",
    "shapeLibraryDetailTab", "shapeLibraryDetailStartButton",
    "triadShapesScreen", "triadShapesHeading", "triadShapesStudyButton", "triadShapesQuizButton",
    "triadShapesStudyPanel", "triadShapesStudyStringSet", "triadShapesStudyQuality",
    "triadShapesStudyInversion", "triadShapesStudyCount", "triadShapesStudyGrid",
    "triadShapesQuizPanel", "triadShapesQuizSetup", "triadShapesQuizStringSet",
    "triadShapesQuizQuality", "triadShapesQuizInversion", "triadShapesQuizTone",
    "triadShapesQuizLength", "triadShapesQuizStartButton", "triadShapesQuizQuestion",
    "triadShapesQuizProgress", "triadShapesQuizScore", "triadShapesQuizIdentity",
    "triadShapesQuizPrompt", "triadShapesQuizDiagram", "triadShapesQuizFeedback",
    "triadShapesQuizNextButton", "triadShapesQuizSummary", "triadShapesQuizResult",
    "triadShapesQuizReview", "triadShapesPracticeAgainButton", "triadShapesChangeSettingsButton",
    "triadShapesStudyMissesButton",
    "fretboardVoiceStringSet", "fretboardVoiceStartingChord",
    "fretboardVoiceStartingInversion", "fretboardVoiceFretRange",
    "fretboardVoiceStartingLocation", "fretboardVoiceStartingShapePicker",
    "fretboardVoiceProgressionSource", "fretboardVoiceFinalTonicWrap",
    "fretboardVoiceFinalTonic", "fretboardVoiceCommonWrap",
    "fretboardVoiceCommonProgression", "fretboardVoiceCustom",
    "fretboardVoiceAddChord", "fretboardVoiceAddButton", "fretboardVoiceClearButton",
    "fretboardVoiceCustomSequence", "fretboardVoiceCustomHint",
    "fretboardVoiceStartingShapes", "fretboardVoiceStartingMessage", "fretboardVoiceAutoMessage",
    "fretboardVoiceRangeBehavior", "fretboardVoiceMaxSpan",
    "fretboardVoiceIncludeOpen", "fretboardVoiceShowMovement",
    "fretboardVoiceRouteSummary", "fretboardVoiceTotalMovement",
    "fretboardVoiceSetupRouteButton", "fretboardVoiceSetupLibraryButton",
    "fretboardVoiceBrowseShapesButton", "fretboardVoiceRouteNotice",
    "fretboardVoiceAutomaticInversionNotice", "fretboardVoiceAutomaticInversionNoticeText",
    "fretboardVoiceAutomaticInversionDismiss",
    "fretboardVoiceScreenRouteButton", "fretboardVoiceScreenLibraryButton",
    "fretboardVoiceStudyButton", "fretboardVoiceRecallButton",
    "fretboardVoiceViewDescription", "fretboardVoiceRevealRouteButton",
    "fretboardVoiceRouteMessage", "fretboardVoiceRoute",
    "fretboardVoiceSettingsButton", "fretboardVoiceDetail",
    "fretboardVoiceDetailTitle", "fretboardVoiceDetailIdentity",
    "fretboardVoiceDetailClose", "fretboardVoiceDetailDiagram",
    "fretboardVoiceDetailNotes", "fretboardVoiceDetailTab",
    "fretboardVoiceDetailRoles", "fretboardVoiceDetailPrevious",
    "fretboardVoiceDetailNext",
    "identifierKeyContext", "identifierHoldLast", "identifierFollowSustain",
    "identifierShowAnalysis", "identifierShowAlternates", "identifierMaximumAlternates",
    "identifierAdvancedOptions", "identifierMidiStatus", "identifierEnableMidiButton",
    "identifierHeading",
    "identifierSettingsButton", "identifierStatus", "identifierPlayedNotes",
    "identifierSymbol", "identifierDescription", "identifierConfidence",
    "identifierBass", "identifierUnique", "identifierRoman", "identifierAnalysisDetails",
    "identifierExactNotes", "identifierUniqueDetails", "identifierRoot",
    "identifierBassDetails", "identifierFormula", "identifierInversion",
    "identifierSlash", "identifierDoublings", "identifierMissing", "identifierExtra",
    "identifierRomanDetails", "identifierAlternateNames", "identifierAlternatives",
    "identifierCandidateList", "identifierSaveButton", "identifierFavoritesButton",
    "identifierClearButton", "saveChordPanel", "saveChordCandidate", "saveChordTitle",
    "saveChordNote", "saveChordExactVoicing", "saveChordConfirmButton",
    "saveChordCancelButton", "favoritesBackButton", "favoritesHeading", "favoritesSearch", "favoritesSort",
    "favoritesFilter", "favoritesEmpty", "favoritesList", "favoriteDetail",
    "favoriteDetailHeading", "favoriteDetailAnalysis", "favoriteDetailAlternates",
    "favoriteEditTitle", "favoriteEditNote", "favoriteMatchFeedback",
    "favoriteUpdateButton", "favoritePlayMatchButton", "favoriteDuplicateButton",
    "favoriteDeleteButton", "favoriteCloseButton",
    "enableMidiButton", "midiSetupStatus", "midiActivity", "midiControls", "midiInputWrap",
    "midiInputSelect", "midiAnswerMode", "midiAutoAdvance", "midiShowDetected",
    "midiUseSustain", "triadMidiConnection", "triadMidiHeld", "triadMidiDetected",
    "triadMidiFeedback", "triadMidiDetails", "voiceMidiConnection", "voiceMidiHeld",
    "voiceMidiDetected", "voiceMidiFeedback", "voiceMidiDetails", "playMidiConnection",
    "playMidiHeld", "playMidiDetected", "playMidiFeedback", "playMidiDetails"
  ];
  const elements = Object.fromEntries(ids.map(id => [
    id,
    new FakeElement(id, id.includes("Button") || ["startButton", "nextButton", "restartButton"].includes(id) ? "BUTTON" : "DIV")
  ]));
  elements.midiControls.hidden = true;
  elements.midiAnswerMode.value = "exact-voicing";
  elements.midiShowDetected.checked = true;
  elements.playResponseTimer.checked = true;
  elements.playPracticeType.value = "individual";
  elements.playProgressionSource.value = "common";
  elements.playProgressionVoicingMethod.value = "manual";
  elements.playCommonProgressionSelect.value = "I-IV-V-I";
  elements.playCommonStartingInversion.value = "0";
  elements.playProgressionChordType.value = "major";
  elements.playProgressionInversion.value = "0";
  elements.playProgressionShowHints.checked = true;
  elements.playProgressionRepeat.checked = true;
  elements.playPracticeDirection.value = "chord-to-play";
  elements.playPoolMode.value = "filters";
  elements.playRootMode.value = "all";
  elements.playCustomOrder.value = "random";
  elements.playCustomRepeat.checked = true;
  elements.playKeyboardDiagramLabels.value = "chord-tones";
  elements.voiceShowTargetNotes.value = "on";
  elements.voiceExerciseType.value = "single";
  elements.voiceProgressionSource.value = "choose";
  elements.voiceProgressionGuidance.value = "training";
  elements.voiceAssistLevel.value = "full";
  elements.voiceCommonProgressionSelect.value = "I-vi-IV-V";
  elements.voiceProgressionLength.value = "4";
  elements.voiceProgressionAddChord.value = "I";
  elements.fretboardStringSet.value = "Any";
  elements.fretboardFretRange.value = "any";
  elements.fretboardDotLabels.value = "chord-tones";
  elements.fretboardResponseTimer.checked = true;
  elements.fretboardReturnStudyButton.hidden = true;
  elements.keyStudyStringSet.value = "GBE";
  elements.keyStudyQuality.value = "all";
  elements.keyStudyFretRange.value = "any";
  elements.keyStudyOrdering.value = "position";
  elements.keyStudyDotLabels.value = "chord-tones";
  elements.keyStudyView.value = "chord";
  elements.keyStudyStrategy.value = "lowest";
  elements.keyStudySequenceInversion.value = "0";
  elements.keyStudyAdvanceDelay.value = "5000";
  elements.shapeLibraryStringSet.value = "GBE";
  elements.shapeLibraryFretRange.value = "any";
  elements.triadShapesStudyStringSet.value = "GBE";
  elements.triadShapesStudyQuality.value = "both";
  elements.triadShapesStudyInversion.value = "all";
  elements.triadShapesQuizStringSet.value = "GBE";
  elements.triadShapesQuizQuality.value = "both";
  elements.triadShapesQuizInversion.value = "all";
  elements.triadShapesQuizTone.value = "mixed";
  elements.triadShapesQuizLength.value = "10";
  elements.fretboardVoiceStringSet.value = "GBE";
  elements.fretboardVoiceStartingChord.value = "I";
  elements.fretboardVoiceStartingInversion.value = "1";
  elements.fretboardVoiceStartingLocation.value = "auto";
  elements.fretboardVoiceFretRange.value = "any";
  elements.fretboardVoiceProgressionSource.value = "ascending";
  elements.fretboardVoiceCommonProgression.value = "I-IV-V-I";
  elements.fretboardVoiceRangeBehavior.value = "stay";
  elements.fretboardVoiceMaxSpan.value = "4";
  elements.fretboardVoiceFinalTonic.checked = true;
  elements.identifierKeyContext.value = "none";
  elements.identifierHoldLast.value = "on";
  elements.identifierFollowSustain.value = "off";
  elements.identifierShowAnalysis.value = "off";
  elements.identifierShowAlternates.value = "on";
  elements.identifierMaximumAlternates.value = "5";
  elements.identifierAdvancedOptions.open = false;
  elements.identifierAnalysisDetails.open = false;
  elements.favoritesSort.value = "recent";
  elements.favoritesFilter.value = "all";
  elements.saveChordExactVoicing.checked = true;
  [
    "playRootC", "playRootDb", "playRootD", "playRootEb", "playRootE", "playRootF",
    "playRootFs", "playRootG", "playRootAb", "playRootA", "playRootBb", "playRootB",
    "playChordMajor", "playChordMinor", "playInversionRoot", "playInversionFirst",
    "playInversionSecond"
  ].forEach(id => { elements[id].checked = true; });
  [
    ["playRootC", "0"], ["playRootDb", "1"], ["playRootD", "2"],
    ["playRootEb", "3"], ["playRootE", "4"], ["playRootF", "5"],
    ["playRootFs", "6"], ["playRootG", "7"], ["playRootAb", "8"],
    ["playRootA", "9"], ["playRootBb", "10"], ["playRootB", "11"],
    ["playChordMajor", "major"], ["playChordMinor", "minor"],
    ["playChordDiminished", "diminished"], ["playChordAugmented", "augmented"],
    ["playChordSus2", "sus2"], ["playChordSus4", "sus4"],
    ["playChordDominant7", "dominant-seven"], ["playChordMajor7", "major-seven"],
    ["playChordMinor7", "minor-seven"], ["playChordMinorMajor7", "minor-major-seven"],
    ["playChordHalfDiminished7", "half-diminished-seven"],
    ["playChordDiminished7", "diminished-seven"],
    ["playChordAdd9", "add9"], ["playChordMinorAdd9", "minor-add9"],
    ["playChordSix", "six"], ["playChordMinorSix", "minor-six"],
    ["playInversionRoot", "0"], ["playInversionFirst", "1"],
    ["playInversionSecond", "2"], ["playInversionThird", "3"]
    , ["playCustomInversionRoot", "0"], ["playCustomInversionFirst", "1"],
    ["playCustomInversionSecond", "2"], ["playCustomInversionThird", "3"]
  ].forEach(([id, value]) => { elements[id].value = value; });
  elements.playCustomInversionRoot.checked = true;
  [
    ["homeKeyboardButton", "keyboard"],
    ["homeFretboardButton", "fretboard"],
    ["homeExploreButton", "explore"]
  ].forEach(([id, area]) => {
    elements[id].dataset.area = area;
  });
  [
    ["keyboardRecognizeButton", "triad", "keyboard"],
    ["keyboardPlayButton", "play", "keyboard"],
    ["keyboardVoiceButton", "voice", "keyboard"],
    ["fretboardVoiceLeadingButton", "fretboard-voice", "fretboard"],
    ["fretboardTriadShapesButton", "triad-shapes", "fretboard"],
    ["fretboardPracticeButton", "fretboard", "fretboard"],
    ["fretboardKeyStudyButton", "key-study", "fretboard"],
    ["exploreIdentifierButton", "identifier", "explore"],
    ["exploreFavoritesButton", "favorites", "explore"]
  ].forEach(([id, tool, area]) => {
    elements[id].dataset.tool = tool;
    elements[id].dataset.area = area;
  });
  elements.keyboardRecognizeButton.dataset.legacy = "true";
  elements.keyboardVoiceButton.dataset.legacy = "true";
  elements.fretboardPracticeButton.dataset.legacy = "true";
  elements.fretboardKeyStudyButton.dataset.legacy = "true";
  [
    "voiceProgressionDegreeI", "voiceProgressionDegreeIi",
    "voiceProgressionDegreeIii", "voiceProgressionDegreeIV",
    "voiceProgressionDegreeV", "voiceProgressionDegreeVi",
    "keyStudyDegreeI", "keyStudyDegreeIi", "keyStudyDegreeIii",
    "keyStudyDegreeIV", "keyStudyDegreeV", "keyStudyDegreeVi",
    "keyStudyInversionRoot", "keyStudyInversionFirst", "keyStudyInversionSecond"
  ].forEach(id => {
    elements[id].checked = true;
  });
  [
    ["voiceProgressionDegreeI", "I"],
    ["voiceProgressionDegreeIi", "ii"],
    ["voiceProgressionDegreeIii", "iii"],
    ["voiceProgressionDegreeIV", "IV"],
    ["voiceProgressionDegreeV", "V"],
    ["voiceProgressionDegreeVi", "vi"],
    ["keyStudyDegreeI", "I"],
    ["keyStudyDegreeIi", "ii"],
    ["keyStudyDegreeIii", "iii"],
    ["keyStudyDegreeIV", "IV"],
    ["keyStudyDegreeV", "V"],
    ["keyStudyDegreeVi", "vi"],
    ["keyStudyDegreeVii", "vii°"],
    ["keyStudyInversionRoot", "0"],
    ["keyStudyInversionFirst", "1"],
    ["keyStudyInversionSecond", "2"]
  ].forEach(([id, value]) => {
    elements[id].value = value;
  });
  const modeInputs = [
    new FakeElement("modeTriad", "INPUT"),
    new FakeElement("modeVoice", "INPUT"),
    new FakeElement("modePlay", "INPUT"),
    new FakeElement("modeFretboard", "INPUT"),
    new FakeElement("modeKeyStudy", "INPUT"),
    new FakeElement("modeFretboardVoice", "INPUT"),
    new FakeElement("modeTriadShapes", "INPUT"),
    new FakeElement("modeIdentifier", "INPUT")
  ];
  ["triad", "voice", "play", "fretboard", "key-study", "fretboard-voice", "triad-shapes", "identifier"].forEach((value, index) => {
    modeInputs[index].value = value;
    modeInputs[index].checked = value === choices.mode;
  });
  const presetButtons = ["I-IV-V", "I-IV-V-vi", "major", "minor", "all"].map(value => {
    const button = new FakeElement(`preset-${value}`, "BUTTON");
    button.dataset.keyStudyPreset = value;
    return button;
  });
  const chordPracticePresetButtons = ["major-minor", "sevenths", "recognition", "performance"].map(value => {
    const button = new FakeElement(`chord-practice-preset-${value}`, "BUTTON");
    button.dataset.chordPracticePreset = value;
    return button;
  });
  const playDifficultyInputs = [
    new FakeElement("playGuided", "INPUT"),
    new FakeElement("playStandard", "INPUT"),
    new FakeElement("playChallenge", "INPUT")
  ];
  ["guided", "standard", "challenge"].forEach((value, index) => {
    playDifficultyInputs[index].value = value;
    playDifficultyInputs[index].checked = value === choices.playDifficulty;
  });

  const document = {
    title: "Triad Trainer",
    activeElement: null,
    getElementById(id) {
      return elements[id];
    },
    querySelector(selector) {
      const match = selector.match(/input\[name="([^"]+)"\]:checked/);
      assert(match, `supported selector: ${selector}`);
      if (match[1] === "mode") return modeInputs.find(input => input.checked);
      if (match[1] === "playDifficulty") {
        return playDifficultyInputs.find(input => input.checked);
      }
      return { value: choices[match[1]] };
    },
    querySelectorAll(selector) {
      if (selector === 'input[name="mode"]') return modeInputs;
      if (selector === 'input[name="playDifficulty"]') return playDifficultyInputs;
      if (selector === "[data-key-study-preset]") return presetButtons;
      if (selector === "[data-chord-practice-preset]") return chordPracticePresetButtons;
      assert.fail(`supported selector list: ${selector}`);
    },
    createElement(tagName) {
      return new FakeElement("", tagName.toUpperCase());
    },
    createElementNS(_namespace, tagName) {
      return new FakeElement("", tagName.toUpperCase());
    },
    addEventListener(type, handler) {
      documentListeners[type] = handler;
    }
  };

  const window = {
    location: {
      pathname: choices.pathname || "",
      search: choices.search || (choices.voiceDebug ? "?debugVoiceLeading=1" : ""),
      hash: choices.hash || ""
    },
    setInterval(callback) {
      const id = nextTimerId++;
      timers.set(id, callback);
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timeouts.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) {
      timeouts.delete(id);
    },
    addEventListener() {},
    confirm() {
      return true;
    }
  };
  const localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    }
  };
  class FakeDate extends Date {
    static now() {
      return now;
    }
  }

  const context = {
    document,
    window,
    localStorage,
    Date: FakeDate,
    Math,
    Number,
    navigator: midiNavigator,
    console
  };
  vm.createContext(context);
  vm.runInContext(scriptMatch[1], context, { filename: "index.html" });

  return {
    api: window.__voiceLeadingTrainerTests,
    choices,
    elements,
    modeInputs,
    playDifficultyInputs,
    storage,
    getActiveElement() {
      return document.activeElement;
    },
    advance(milliseconds) {
      now += milliseconds;
      [...timers.values()].forEach(callback => callback());
      let dueCallbacks = [...timeouts.entries()].filter(([, timeout]) => timeout.due <= now);
      while (dueCallbacks.length) {
        for (const [id, timeout] of dueCallbacks) {
          timeouts.delete(id);
          timeout.callback();
        }
        dueCallbacks = [...timeouts.entries()].filter(([, timeout]) => timeout.due <= now);
      }
    },
    keyDown(key) {
      documentListeners.keydown({
        key,
        preventDefault() {}
      });
    }
  };
}

const harness = createHarness();
const { api } = harness;
const key = api.key;
const chord = degree => key.chords.find(item => item.degree === degree);
const naturals = midi => midi.map(note => key.noteNames[note % 12]).join(" ");

assert.strictEqual(harness.elements.homeScreen.hidden, false, "the app opens on the home screen");
assert.strictEqual(harness.elements.setupScreen.hidden, true, "tool settings do not crowd the initial home screen");
assert.strictEqual(harness.elements.continueSession.hidden, true, "Continue Last Session is hidden before any tool has been used");
assert(html.includes("What would you like to work on?"), "home screen has the requested goal-oriented heading");
assert(html.includes("<strong>Keyboard</strong>") && html.includes("<strong>Fretboard</strong>") && html.includes("<strong>Explore</strong>"), "home screen shows the three top-level areas");
assert(html.includes('id="legacyModeSelector" hidden'), "the old stable mode controls remain only as a hidden compatibility layer");
assert(html.includes('data-exercise-id="keyboard.triad_display"') &&
  html.includes('data-exercise-id="keyboard.chord_practice"') &&
  html.includes('data-exercise-id="fretboard.voice_leading"') &&
  html.includes('data-exercise-id="fretboard.triad_shapes.study"') &&
  html.includes('data-exercise-id="theory.chord_identifier"') &&
  html.includes('data-feature-id="chord_library.favorites_view"'), "existing stable IDs remain available on the reorganized navigation");
assert.strictEqual(api.exerciseRegistry["fretboard.voice_leading"].mode, "fretboard-voice", "the direct Fretboard Voice Leading route keeps its stable ID");
assert.strictEqual(api.exerciseRegistry["keyboard.voice_leading"].aliasTo, "keyboard.chord_practice", "the old Keyboard Voice Leading exercise ID redirects to Chord Practice");
assert(html.includes('id="keyboardVoiceButton"') && html.includes('data-legacy="true" hidden'), "standalone Keyboard Voice Leading is absent from visible navigation");
assert(/@media \(max-width: 600px\)[\s\S]*\.app-navigation/.test(html), "navigation has a narrow-screen layout without a six-button row");

harness.elements.homeKeyboardButton.dispatch("click");
assert.strictEqual(harness.elements.areaLandingScreen.hidden, true, "Keyboard bypasses the one-item landing page");
assert.strictEqual(harness.elements.setupScreen.hidden, false, "Keyboard opens directly into Chord Practice");
assert.strictEqual(harness.api.getSelectedMode(), "play", "Keyboard selects Chord Practice directly");
assert.strictEqual(harness.elements.playPracticeType.value, "individual", "a new Keyboard visit opens the normal Individual Chords setup");
assert.strictEqual(harness.elements.title.textContent, "Chord Practice", "direct Keyboard navigation uses the Chord Practice heading");
assert.strictEqual(harness.getActiveElement(), harness.elements.title, "focus moves directly to the Chord Practice heading");

harness.elements.keyboardRecognizeButton.dispatch("click");
assert.strictEqual(harness.elements.setupScreen.hidden, false, "the legacy Recognize Triads route opens Chord Practice settings");
assert.strictEqual(harness.api.getSelectedMode(), "play", "the legacy Recognize Triads route redirects to Chord Practice");
assert.strictEqual(harness.elements.title.textContent, "Chord Practice", "the consolidated tool uses its new heading");
assert.strictEqual(harness.elements.navAreaButton.textContent, "Keyboard", "breadcrumb identifies the active area");
assert.strictEqual(harness.elements.navToolName.textContent, "Chord Practice", "breadcrumb identifies the consolidated tool");
assert.strictEqual(harness.getActiveElement(), harness.elements.title, "focus moves to the selected tool heading");

harness.elements.navAreaButton.dispatch("click");
assert.strictEqual(harness.elements.setupScreen.hidden, false, "the Keyboard breadcrumb returns directly to Chord Practice without a wrapper page");
harness.elements.navHomeButton.dispatch("click");
assert.strictEqual(harness.elements.homeScreen.hidden, false, "breadcrumb Home returns to the home screen");
assert.strictEqual(harness.getActiveElement(), harness.elements.homeHeading, "focus returns to the home heading");

const keyboardLandingRoute = createHarness({ search: "?area=keyboard" });
assert.strictEqual(keyboardLandingRoute.elements.setupScreen.hidden, false, "an old Keyboard landing URL redirects directly to Chord Practice");
assert.strictEqual(keyboardLandingRoute.api.getSelectedMode(), "play", "the general Keyboard route selects Chord Practice");
const keyboardVoiceRoute = createHarness({ search: "?exercise=keyboard.voice_leading" });
assert.strictEqual(keyboardVoiceRoute.elements.setupScreen.hidden, false, "an old Keyboard Voice Leading URL opens Chord Practice setup");
assert.strictEqual(keyboardVoiceRoute.elements.playPracticeType.value, "progression", "an old Keyboard Voice Leading URL selects Progression practice");
assert.strictEqual(keyboardVoiceRoute.elements.playProgressionVoicingMethod.value, "nearest", "the legacy route retains Nearest Voicings behavior");

const landingCoverage = createHarness();
landingCoverage.elements.homeFretboardButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.areaLandingScreen.hidden, false, "Fretboard opens its focused two-tool landing page");
assert.strictEqual(landingCoverage.elements.fretboardVoiceLeadingButton.hidden, false, "Fretboard landing shows Voice Leading");
assert.strictEqual(landingCoverage.elements.fretboardTriadShapesButton.hidden, false, "Fretboard landing shows Triad Shapes");
assert.strictEqual(landingCoverage.elements.fretboardPracticeButton.hidden, true, "Fretboard Practice is not visible as a destination");
assert.strictEqual(landingCoverage.elements.fretboardKeyStudyButton.hidden, true, "Key Study is not visible as a separate destination");
assert.strictEqual(landingCoverage.elements.fretboardAreaTabs.hidden, true, "the compact tool switcher stays out of the landing page");
landingCoverage.elements.fretboardVoiceLeadingButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.setupScreen.hidden, false, "Voice Leading opens from the Fretboard landing page");
assert.strictEqual(landingCoverage.api.getSelectedMode(), "fretboard-voice", "Voice Leading keeps its direct primary mode");
assert.strictEqual(landingCoverage.elements.fretboardVoiceSettings.hidden, false, "direct Voice Leading opens its complete setup");
assert.strictEqual(landingCoverage.elements.fretboardAreaTabs.hidden, false, "active Fretboard tools expose the compact two-tool switcher");
assert.strictEqual(landingCoverage.elements.navFretboardVoiceLeading.attributes["aria-current"], "page", "Voice Leading is marked active in the tool switcher");
assert.strictEqual(landingCoverage.elements.fretboardVoiceSetupRouteButton.attributes["aria-pressed"], "true", "Route is the default internal view");
assert.strictEqual(landingCoverage.elements.title.textContent, "Fretboard Voice Leading", "Voice Leading has its own focused setup");
landingCoverage.elements.fretboardVoiceStringSet.value = "DGB";
landingCoverage.elements.fretboardVoiceFretRange.value = "5-8";
landingCoverage.elements.fretboardVoiceIncludeOpen.checked = true;
landingCoverage.elements.fretboardVoiceStartingChord.value = "IV";
landingCoverage.elements.fretboardVoiceBrowseShapesButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.keyStudyScreen.hidden, false, "Browse Shapes opens the merged Shape Library");
assert.strictEqual(landingCoverage.api.getSelectedMode(), "fretboard-voice", "Shape Library remains part of Voice Leading");
assert.strictEqual(landingCoverage.elements.shapeLibraryViewButton.attributes["aria-pressed"], "true", "Shape Library exposes its active internal state");
assert.strictEqual(landingCoverage.elements.shapeLibraryStringSet.value, "DGB", "Browse Shapes carries the Route string set");
assert.strictEqual(landingCoverage.elements.shapeLibraryFretRange.value, "5-8", "Browse Shapes carries the Route fret range");
assert.strictEqual(landingCoverage.elements.shapeLibraryIncludeOpen.checked, true, "Browse Shapes carries the open-position setting");
landingCoverage.elements.shapeLibraryRouteButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.setupScreen.hidden, false, "Route returns to the unfinished Voice Leading setup");
assert.strictEqual(landingCoverage.elements.fretboardVoiceStartingChord.value, "IV", "browsing shapes preserves the unfinished starting-chord choice");

const fretboardDefaultStorage = new Map();
const fretboardDefaultFirst = createHarness({}, fretboardDefaultStorage);
fretboardDefaultFirst.elements.homeFretboardButton.dispatch("click");
fretboardDefaultFirst.elements.fretboardVoiceLeadingButton.dispatch("click");
fretboardDefaultFirst.elements.fretboardVoiceSetupLibraryButton.dispatch("click");
const fretboardDefaultRestored = createHarness({}, fretboardDefaultStorage);
fretboardDefaultRestored.elements.homeFretboardButton.dispatch("click");
assert.strictEqual(fretboardDefaultRestored.elements.areaLandingScreen.hidden, false, "returning to Fretboard still presents the two primary choices");
assert.strictEqual(fretboardDefaultRestored.elements.fretboardVoiceLeadingButton.dataset.default, "true", "the most recently used primary Fretboard tool is highlighted");
fretboardDefaultRestored.elements.fretboardVoiceLeadingButton.dispatch("click");
assert.strictEqual(fretboardDefaultRestored.elements.keyStudyScreen.hidden, false, "the most recently used Shape Library view persists inside Voice Leading");

landingCoverage.elements.navHomeButton.dispatch("click");
landingCoverage.elements.homeExploreButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.exploreIdentifierButton.hidden, false, "Explore landing shows Chord Identifier");
assert.strictEqual(landingCoverage.elements.exploreFavoritesButton.hidden, false, "Explore landing shows Favorite Chords");
landingCoverage.elements.exploreIdentifierButton.dispatch("click");
assert.strictEqual(landingCoverage.elements.identifierScreen.hidden, false, "Chord Identifier opens directly into listening");
assert.strictEqual(landingCoverage.elements.identifierAdvancedOptions.open, false, "Chord Identifier Advanced Options are collapsed by default");
assert.strictEqual(landingCoverage.elements.identifierAnalysisDetails.open, false, "Analysis is a collapsed disclosure by default");
assert.strictEqual(landingCoverage.elements.identifierKeyContext.hidden, false, "Key Context remains visible in the primary Chord Identifier experience");
assert.strictEqual(landingCoverage.getActiveElement(), landingCoverage.elements.identifierHeading, "direct tool navigation moves focus to the main heading");

const continueStorage = new Map();
const continueFirst = createHarness({}, continueStorage);
continueFirst.elements.homeKeyboardButton.dispatch("click");
continueFirst.elements.keyboardVoiceButton.dispatch("click");
continueFirst.elements.voiceKeySelect.value = "g-major";
continueFirst.elements.voiceKeySelect.dispatch("change");
continueFirst.elements.playProgressionStartButton.dispatch("click");
const continueRestored = createHarness({}, continueStorage);
assert.strictEqual(continueRestored.elements.continueSession.hidden, false, "Continue Last Session appears after a tool has been used");
assert(continueRestored.elements.continueSessionContext.textContent.includes("Chord Practice") &&
  continueRestored.elements.continueSessionContext.textContent.includes("Progression"), "legacy Voice Leading continues as Chord Practice Progression");
assert(continueRestored.elements.continueSessionContext.textContent.includes("G major"), "last-session context reflects restored relevant settings");
continueRestored.elements.continueSessionButton.dispatch("click");
assert.strictEqual(continueRestored.api.getSelectedMode(), "play", "Continue Last Session restores the consolidated Chord Practice tool");
assert.strictEqual(continueRestored.elements.playPracticeType.value, "progression", "legacy Voice Leading restores Progression practice");
assert.strictEqual(continueRestored.elements.playProgressionVoicingMethod.value, "nearest", "legacy Voice Leading restores Nearest Voicings");
assert.strictEqual(continueRestored.elements.voiceKeySelect.value, "g-major", "Continue Last Session preserves that tool's saved settings");

const fretboardContinueStorage = new Map();
const fretboardContinueFirst = createHarness({}, fretboardContinueStorage);
fretboardContinueFirst.elements.homeFretboardButton.dispatch("click");
fretboardContinueFirst.elements.fretboardVoiceLeadingButton.dispatch("click");
fretboardContinueFirst.elements.fretboardVoiceKeySelect.value = "g-major";
fretboardContinueFirst.elements.fretboardVoiceStringSet.value = "DGB";
fretboardContinueFirst.elements.fretboardVoiceKeySelect.dispatch("change");
fretboardContinueFirst.elements.fretboardVoiceStringSet.dispatch("change");
const fretboardContinueRestored = createHarness({}, fretboardContinueStorage);
assert.strictEqual(
  fretboardContinueRestored.elements.continueSessionContext.textContent,
  "Fretboard Voice Leading · G major · DGB",
  "Continue Last Session identifies Voice Leading as a primary Fretboard destination"
);
fretboardContinueRestored.elements.continueSessionButton.dispatch("click");
assert.strictEqual(fretboardContinueRestored.api.getSelectedMode(), "fretboard-voice", "Continue Last Session restores Fretboard Voice Leading directly");
assert.strictEqual(fretboardContinueRestored.elements.fretboardVoiceSettings.hidden, false, "continued Voice Leading opens its own setup");

const shapeContinueStorage = new Map();
const shapeContinueFirst = createHarness({}, shapeContinueStorage);
shapeContinueFirst.elements.homeFretboardButton.dispatch("click");
shapeContinueFirst.elements.fretboardVoiceLeadingButton.dispatch("click");
shapeContinueFirst.elements.fretboardVoiceKeySelect.value = "a-flat-major";
shapeContinueFirst.elements.fretboardVoiceKeySelect.dispatch("change");
shapeContinueFirst.elements.fretboardVoiceSetupLibraryButton.dispatch("click");
const shapeContinueRestored = createHarness({}, shapeContinueStorage);
assert(shapeContinueRestored.elements.continueSessionContext.textContent.includes("Shape Library"), "Continue Last Session identifies the internal Shape Library view");
assert(shapeContinueRestored.elements.continueSessionContext.textContent.includes("A-flat major"), "Shape Library continuation includes the shared key");
shapeContinueRestored.elements.continueSessionButton.dispatch("click");
assert.strictEqual(shapeContinueRestored.elements.keyStudyScreen.hidden, false, "Continue Last Session restores Shape Library directly");
assert.strictEqual(shapeContinueRestored.api.getSelectedMode(), "fretboard-voice", "Shape Library continuation remains within Voice Leading");

const legacyFretboardRouteStorage = new Map([
  ["musicianship-last-session", JSON.stringify({
    tool: "key-study",
    exerciseId: "fretboard.voice_leading"
  })]
]);
const legacyFretboardRoute = createHarness({}, legacyFretboardRouteStorage);
legacyFretboardRoute.elements.continueSessionButton.dispatch("click");
assert.strictEqual(legacyFretboardRoute.api.getSelectedMode(), "fretboard-voice", "an old Key Study-linked Voice Leading session redirects to the direct route");
assert.strictEqual(legacyFretboardRoute.elements.keyStudyScreen.hidden, false, "an old Key Study destination opens Shape Library");
assert.strictEqual(
  JSON.parse(legacyFretboardRouteStorage.get("musicianship-last-session")).tool,
  "fretboard-voice",
  "the legacy last-session destination is normalized to the primary Voice Leading tool"
);

const legacyFretboardNavigation = createHarness();
legacyFretboardNavigation.elements.navFretboardKeyStudy.dispatch("click");
assert.strictEqual(legacyFretboardNavigation.elements.keyStudyScreen.hidden, false, "the old Key Study navigation route redirects to Shape Library");
assert.strictEqual(legacyFretboardNavigation.api.getSelectedMode(), "fretboard-voice", "old Key Study navigation no longer exposes a standalone mode");
legacyFretboardNavigation.elements.navFretboardPractice.dispatch("click");
assert.strictEqual(legacyFretboardNavigation.elements.setupScreen.hidden, false, "the old Fretboard Practice navigation route redirects to Route setup");
assert.strictEqual(legacyFretboardNavigation.api.getSelectedMode(), "fretboard-voice", "old Fretboard Practice navigation migrates to Voice Leading");

const canonicalTriadShapes = [...api.canonicalTriadShapes];
assert.strictEqual(canonicalTriadShapes.length, 24, "the canonical movable-triad library contains exactly 24 shapes");
assert.strictEqual(canonicalTriadShapes.filter(shape => shape.quality === "major").length, 12, "the library contains 12 major shapes");
assert.strictEqual(canonicalTriadShapes.filter(shape => shape.quality === "minor").length, 12, "the library contains 12 minor shapes");
for (const stringSet of ["EAD", "ADG", "DGB", "GBE"]) {
  const setShapes = canonicalTriadShapes.filter(shape => shape.stringSet === stringSet);
  assert.strictEqual(setShapes.length, 6, `${stringSet} contains three major and three minor shapes`);
  for (const quality of ["major", "minor"]) {
    const qualityShapes = setShapes.filter(shape => shape.quality === quality);
    assert.deepStrictEqual(
      [...qualityShapes.map(shape => shape.inversion).sort()],
      ["first", "root", "second"],
      `${stringSet} ${quality} contains one of every inversion`
    );
  }
}
for (const shape of canonicalTriadShapes) {
  assert.strictEqual(shape.markers.length, 3, `${shape.id} has one marker on each selected string`);
  assert.strictEqual(new Set(shape.markers.map(marker => marker.stringIndex)).size, 3, `${shape.id} uses three distinct adjacent strings`);
  assert(shape.markers.every(marker => marker.relativeFret >= 0 && marker.relativeFret <= 3), `${shape.id} is a compact closed shape normalized to reference frets 5–8`);
  const labels = shape.markers.map(marker => api.triadShapeToneLabel(marker.chordTone)).sort();
  assert.deepStrictEqual(
    [...labels],
    shape.quality === "major" ? ["3", "5", "R"] : ["5", "R", "♭3"],
    `${shape.id} uses the correct quality-specific chord-tone labels`
  );
  const expectedBass = shape.inversion === "root"
    ? "root"
    : shape.inversion === "first"
      ? shape.quality === "minor" ? "minorThird" : "third"
      : "fifth";
  assert.strictEqual(shape.markers[0].chordTone, expectedBass, `${shape.id} derives inversion from its lowest-sounding string`);
}
assert.strictEqual(new Set(canonicalTriadShapes.map(shape => shape.id)).size, 24, "no octave-duplicate or open-position variants are stored separately");
const majorRootEad = canonicalTriadShapes.find(shape => shape.stringSet === "EAD" && shape.quality === "major" && shape.inversion === "root");
const majorRootGbe = canonicalTriadShapes.find(shape => shape.stringSet === "GBE" && shape.quality === "major" && shape.inversion === "root");
const minorRootDgb = canonicalTriadShapes.find(shape => shape.stringSet === "DGB" && shape.quality === "minor" && shape.inversion === "root");
const majorSecondEad = canonicalTriadShapes.find(shape => shape.stringSet === "EAD" && shape.quality === "major" && shape.inversion === "second");
const minorSecondGbe = canonicalTriadShapes.find(shape => shape.stringSet === "GBE" && shape.quality === "minor" && shape.inversion === "second");
assert.deepStrictEqual([...majorRootEad.markers.map(marker => marker.relativeFret)], [3, 2, 0], "all-fourths EAD tuning produces the expected root-position geometry");
assert.deepStrictEqual([...majorRootGbe.markers.map(marker => marker.relativeFret)], [2, 2, 0], "GBE geometry correctly accounts for the major-third G-to-B tuning interval");
assert.strictEqual(api.triadShapeChordName(minorRootDgb), "A minor", "DGB minor root position receives its specific reference-fret chord name");
assert.strictEqual(api.triadShapeChordName(majorSecondEad), "E-flat major", "flat roots use readable word-based accidentals");
assert.strictEqual(api.triadShapeChordName(minorSecondGbe), "F-sharp minor", "sharp roots use readable word-based accidentals");
assert.strictEqual(api.filterTriadShapes({ stringSet: "GBE", quality: "both", inversion: "all" }).length, 6, "Study filtering returns six shapes for one complete string set");
assert.strictEqual(api.filterTriadShapes({ stringSet: "GBE", quality: "major", inversion: "all" }).length, 3, "Study quality filtering returns three major shapes");
assert.strictEqual(api.filterTriadShapes({ stringSet: "GBE", quality: "minor", inversion: "first" }).length, 1, "combined quality and inversion filters return one exact shape");
assert.strictEqual(api.filterTriadShapes({ stringSet: "all", quality: "both", inversion: "root" }).length, 8, "all-string filtering returns both root-position qualities on every set");

const triadShapesStudyUi = createHarness();
triadShapesStudyUi.elements.homeFretboardButton.dispatch("click");
triadShapesStudyUi.elements.fretboardTriadShapesButton.dispatch("click");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesScreen.hidden, false, "Triad Shapes opens directly from the Fretboard landing page");
assert.strictEqual(triadShapesStudyUi.api.getSelectedMode(), "triad-shapes", "Triad Shapes has its own primary Fretboard mode");
assert.strictEqual(triadShapesStudyUi.api.getTriadShapesMode(), "study", "new Triad Shapes state defaults to Study");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesStudyPanel.hidden, false, "Study is visible by default");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesStudyGrid.children.length, 6, "the default GBE Study grid shows all six major and minor shapes");
assert.strictEqual(triadShapesStudyUi.elements.navFretboardTriadShapes.attributes["aria-current"], "page", "the Fretboard tool switcher marks Triad Shapes active");
triadShapesStudyUi.elements.triadShapesStudyQuality.value = "minor";
triadShapesStudyUi.elements.triadShapesStudyQuality.dispatch("change");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesStudyGrid.children.length, 3, "Study quality changes update the grid immediately");
triadShapesStudyUi.elements.triadShapesStudyInversion.value = "first";
triadShapesStudyUi.elements.triadShapesStudyInversion.dispatch("change");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesStudyGrid.children.length, 1, "Study inversion filtering narrows the grid to one shape");
const studyDescendants = element => element.children.flatMap(child => [child, ...studyDescendants(child)]);
const studySvgParts = studyDescendants(triadShapesStudyUi.elements.triadShapesStudyGrid);
assert(studySvgParts.some(element => element.attributes["data-role"] === "♭3"), "minor Study diagrams render the flat-third symbol");
assert(studySvgParts.some(element => element.tagName === "CIRCLE" && element.attributes["data-root"] === "true" && element.attributes.fill === "#165f48"), "Study diagrams retain the shared highlighted root marker");
assert(!studySvgParts.some(element => element.tagName === "BUTTON"), "non-interactive Study diagrams keep the shared renderer's ordinary marker path");
const studySvg = studySvgParts.find(element => element.tagName === "SVG");
assert(studySvg.attributes["aria-label"].includes("Strings low to high: G, B, E") && studySvg.attributes["aria-label"].includes("♭3"), "Study diagrams expose string names and chord-tone labels accessibly");

const quizDeck = api.buildTriadShapeQuizDeck({
  stringSet: "all",
  quality: "both",
  inversion: "all",
  tone: "mixed",
  length: "20"
}, (() => {
  let seed = 17;
  return () => ((seed = seed * 48271 % 2147483647) / 2147483647);
})());
assert.strictEqual(quizDeck.length, 20, "the configured quiz deck has the requested finite session length");
assert(quizDeck.every((entry, index) => index === 0 || entry.shapeId !== quizDeck[index - 1].shapeId), "quiz ordering avoids immediate shape repetition when the pool has alternatives");
assert.strictEqual(api.evaluateTriadShapeQuizAnswer({ targetTone: "root" }, "root").correct, true, "root identification grades correctly");
assert.strictEqual(api.evaluateTriadShapeQuizAnswer({ targetTone: "third" }, "third").correct, true, "major-third identification grades correctly");
assert.strictEqual(api.evaluateTriadShapeQuizAnswer({ targetTone: "minorThird" }, "minorThird").correct, true, "minor-third identification grades correctly");
assert.strictEqual(api.evaluateTriadShapeQuizAnswer({ targetTone: "fifth" }, "fifth").correct, true, "fifth identification grades correctly");

triadShapesStudyUi.elements.triadShapesQuizButton.dispatch("click");
triadShapesStudyUi.elements.triadShapesQuizQuality.value = "major";
triadShapesStudyUi.elements.triadShapesQuizInversion.value = "root";
triadShapesStudyUi.elements.triadShapesQuizTone.value = "root";
triadShapesStudyUi.elements.triadShapesQuizLength.value = "5";
triadShapesStudyUi.elements.triadShapesQuizStartButton.dispatch("click");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizQuestion.hidden, false, "Start Quiz presents one shape question");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizProgress.textContent, "Question 1 of 5", "finite quiz progress starts at question one");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizIdentity.textContent, "D major · Root position", "Quiz header shows the specific chord and inversion without repeating the GBE string set");
let quizMarkers = triadShapesStudyUi.elements.triadShapesQuizDiagram.children.filter(child => child.tagName === "BUTTON");
assert.strictEqual(quizMarkers.length, 3, "the quiz diagram exposes three real marker buttons");
assert(/\.triad-shapes-quiz-diagram\.triad-shape-interactive \.fretboard-svg \{[\s\S]*?pointer-events: none;/.test(html), "interactive Quiz diagrams make the underlying SVG a non-intercepting decorative layer");
assert(/\.triad-shape-marker-button \{[\s\S]*?z-index: 1;[\s\S]*?pointer-events: auto;[\s\S]*?touch-action: manipulation;/.test(html), "the complete visible marker button owns mouse and touch activation above the SVG");
assert(/button\.triad-shape-marker-button:active:not\(:disabled\) \{\s*transform: translate\(-50%, -50%\);\s*\}/.test(html), "the marker preserves its centering transform while active instead of inheriting the global button press movement");
assert(quizMarkers.every(marker => marker.textContent === ""), "quiz markers remain visually unlabeled before an answer");
assert(quizMarkers.every(marker => /^Select marker on the /.test(marker.attributes["aria-label"]) && !/root|third|fifth/.test(marker.attributes["aria-label"])), "hidden marker accessible labels describe location without revealing the answer");
assert.strictEqual(new Set(quizMarkers.map(marker => marker.dataset.markerId)).size, 3, "each rendered quiz marker exposes a stable unique identity");
assert(quizMarkers.every(marker => marker.dataset.stringIndex !== undefined && marker.dataset.relativeFret !== undefined && marker.dataset.fret !== undefined && marker.dataset.chordTone), "each rendered marker carries structured string, fret, and chord-tone data");
const firstQuestionRootMarker = quizMarkers.find(marker => marker.dataset.chordTone === "root");
firstQuestionRootMarker.dispatch("click", { preventDefault() {}, stopPropagation() {} });
assert(triadShapesStudyUi.elements.triadShapesQuizFeedback.textContent.startsWith("Correct — the root is on the"), "a correct marker click gives immediate string-specific feedback");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizScore.textContent, "Score: 1 correct", "the score updates after a correct answer");
assert.strictEqual(triadShapesStudyUi.api.getTriadShapesQuizState().selectedMarkerId, firstQuestionRootMarker.dataset.markerId, "the answer records the clicked marker identity rather than inferring its position");
const firstAnsweredCount = triadShapesStudyUi.api.getTriadShapesQuizState().answeredCount;
quizMarkers.find(marker => marker !== firstQuestionRootMarker).dispatch("click", { preventDefault() {}, stopPropagation() {} });
assert.strictEqual(triadShapesStudyUi.api.getTriadShapesQuizState().answeredCount, firstAnsweredCount, "only the first rendered-marker submission is accepted");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizScore.textContent, "Score: 1 correct", "a second marker activation cannot change the score");
quizMarkers = triadShapesStudyUi.elements.triadShapesQuizDiagram.children.filter(child => child.tagName === "BUTTON");
assert.deepStrictEqual([...quizMarkers.map(marker => marker.textContent).sort()], ["3", "5", "R"], "all chord-tone labels reveal after answering");
assert.strictEqual(quizMarkers.find(marker => marker.dataset.markerId === firstQuestionRootMarker.dataset.markerId).attributes["aria-pressed"], "true", "the selected marker remains identified without relying only on color");
assert.strictEqual(triadShapesStudyUi.getActiveElement(), triadShapesStudyUi.elements.triadShapesQuizNextButton, "focus moves predictably to Next Shape after feedback");
triadShapesStudyUi.elements.triadShapesQuizNextButton.dispatch("click");
assert.strictEqual(triadShapesStudyUi.api.getTriadShapesQuizState().answered, false, "Next Shape resets the answer lock for the new question");
assert.strictEqual(triadShapesStudyUi.api.getTriadShapesQuizState().selectedMarkerId, null, "Next Shape clears the prior marker identity");
quizMarkers = triadShapesStudyUi.elements.triadShapesQuizDiagram.children.filter(child => child.tagName === "BUTTON");
let enterPrevented = false;
quizMarkers.find(marker => marker.dataset.chordTone === "fifth").dispatch("keydown", {
  key: "Enter",
  preventDefault() { enterPrevented = true; },
  stopPropagation() {}
});
assert.strictEqual(enterPrevented, true, "Enter activates a focused marker through its button keyboard path");
assert(triadShapesStudyUi.elements.triadShapesQuizFeedback.textContent.startsWith("That is the fifth. The root is on the"), "an incorrect marker click identifies both the selected and requested tones");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizScore.textContent, "Score: 1 correct", "an incorrect answer does not increase the score");
triadShapesStudyUi.elements.triadShapesQuizNextButton.dispatch("click");
quizMarkers = triadShapesStudyUi.elements.triadShapesQuizDiagram.children.filter(child => child.tagName === "BUTTON");
const thirdQuestionState = triadShapesStudyUi.api.getTriadShapesQuizState();
let spacePrevented = false;
quizMarkers.find(marker => marker.dataset.chordTone === thirdQuestionState.deck[thirdQuestionState.cursor].targetTone).dispatch("keydown", {
  key: " ",
  preventDefault() { spacePrevented = true; },
  stopPropagation() {}
});
assert.strictEqual(spacePrevented, true, "Space activates a focused marker through its button keyboard path");
assert(triadShapesStudyUi.elements.triadShapesQuizFeedback.textContent.startsWith("Correct —"), "keyboard activation runs the same feedback and grading path as a pointer click");
triadShapesStudyUi.elements.triadShapesQuizNextButton.dispatch("click");
for (let question = 4; question <= 5; question += 1) {
  const state = triadShapesStudyUi.api.getTriadShapesQuizState();
  triadShapesStudyUi.api.answerTriadShapeQuiz(state.deck[state.cursor].targetTone);
  triadShapesStudyUi.elements.triadShapesQuizNextButton.dispatch("click");
}
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizSummary.hidden, false, "the quiz shows a summary after the configured number of questions");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizResult.textContent, "4 of 5 correct · 80%", "the session summary reports correct count, total, and accuracy");
assert(triadShapesStudyUi.elements.triadShapesQuizReview.children.length > 0, "the summary lists missed chord-tone categories");
triadShapesStudyUi.elements.triadShapesPracticeAgainButton.dispatch("click");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizProgress.textContent, "Question 1 of 5", "Practice Again restarts with the same quiz settings");
triadShapesStudyUi.elements.triadShapesChangeSettingsButton.dispatch("click");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizSetup.hidden, false, "Change Settings returns to the compact Quiz setup");
assert.strictEqual(triadShapesStudyUi.elements.triadShapesQuizQuestion.hidden, true, "Change Settings clears the active question without blocking Study mode");

const minorThirdQuizUi = createHarness();
minorThirdQuizUi.elements.homeFretboardButton.dispatch("click");
minorThirdQuizUi.elements.fretboardTriadShapesButton.dispatch("click");
minorThirdQuizUi.elements.triadShapesQuizButton.dispatch("click");
minorThirdQuizUi.elements.triadShapesQuizQuality.value = "minor";
minorThirdQuizUi.elements.triadShapesQuizInversion.value = "first";
minorThirdQuizUi.elements.triadShapesQuizTone.value = "third";
minorThirdQuizUi.elements.triadShapesQuizLength.value = "5";
minorThirdQuizUi.elements.triadShapesQuizStartButton.dispatch("click");
assert.strictEqual(minorThirdQuizUi.elements.triadShapesQuizPrompt.textContent, "Click the minor third.", "minor-quality Third questions use the correct minor-third wording");
const minorMarkers = minorThirdQuizUi.elements.triadShapesQuizDiagram.children.filter(child => child.tagName === "BUTTON");
minorMarkers.find(marker => marker.dataset.chordTone === "minorThird").dispatch("click");
assert(minorThirdQuizUi.elements.triadShapesQuizDiagram.children.some(child => child.tagName === "BUTTON" && child.textContent === "♭3"), "minor-third answers reveal the flat-third symbol");

const triadShapesStorage = new Map();
const savedTriadShapes = createHarness({}, triadShapesStorage);
savedTriadShapes.elements.homeFretboardButton.dispatch("click");
savedTriadShapes.elements.fretboardTriadShapesButton.dispatch("click");
savedTriadShapes.elements.triadShapesQuizButton.dispatch("click");
savedTriadShapes.elements.triadShapesQuizStringSet.value = "all";
savedTriadShapes.elements.triadShapesQuizStringSet.dispatch("change");
savedTriadShapes.elements.triadShapesQuizQuality.value = "minor";
savedTriadShapes.elements.triadShapesQuizQuality.dispatch("change");
const restoredTriadShapes = createHarness({}, triadShapesStorage);
assert.strictEqual(restoredTriadShapes.elements.continueSessionContext.textContent, "Triad Shapes · Quiz · All string sets", "Continue Last Session describes the saved Triad Shapes quiz context");
restoredTriadShapes.elements.homeFretboardButton.dispatch("click");
assert.strictEqual(restoredTriadShapes.elements.fretboardTriadShapesButton.dataset.default, "true", "the Fretboard landing remembers Triad Shapes as the last primary tool");
restoredTriadShapes.elements.fretboardTriadShapesButton.dispatch("click");
assert.strictEqual(restoredTriadShapes.api.getTriadShapesMode(), "quiz", "the last-used Triad Shapes mode restores");
assert.strictEqual(restoredTriadShapes.elements.triadShapesQuizStringSet.value, "all", "quiz string-set settings persist");
assert.strictEqual(restoredTriadShapes.elements.triadShapesQuizQuality.value, "minor", "quiz quality settings persist");

const triadQuizProgressStorage = new Map();
const triadQuizProgressFirst = createHarness({}, triadQuizProgressStorage);
triadQuizProgressFirst.elements.homeFretboardButton.dispatch("click");
triadQuizProgressFirst.elements.fretboardTriadShapesButton.dispatch("click");
triadQuizProgressFirst.elements.triadShapesQuizButton.dispatch("click");
triadQuizProgressFirst.elements.triadShapesQuizTone.value = "fifth";
triadQuizProgressFirst.elements.triadShapesQuizTone.dispatch("change");
triadQuizProgressFirst.elements.triadShapesQuizStartButton.dispatch("click");
triadQuizProgressFirst.api.answerTriadShapeQuiz("fifth");
const triadQuizProgressRestored = createHarness({}, triadQuizProgressStorage);
triadQuizProgressRestored.elements.continueSessionButton.dispatch("click");
assert.strictEqual(triadQuizProgressRestored.elements.triadShapesQuizQuestion.hidden, false, "an in-progress quiz restores through Continue Last Session");
assert.strictEqual(triadQuizProgressRestored.elements.triadShapesQuizProgress.textContent, "Question 1 of 10", "restored quiz progress keeps the current question number");
assert.strictEqual(triadQuizProgressRestored.elements.triadShapesQuizScore.textContent, "Score: 1 correct", "restored quiz progress keeps its score");
assert.strictEqual(triadQuizProgressRestored.elements.triadShapesQuizNextButton.hidden, false, "an answered restored question remains inspectable before Next Shape");

const triadShapesStudyRoute = createHarness({ search: "?exercise=fretboard.triad_shapes.study" });
assert.strictEqual(triadShapesStudyRoute.elements.triadShapesScreen.hidden, false, "the stable Study route opens Triad Shapes directly");
assert.strictEqual(triadShapesStudyRoute.api.getTriadShapesMode(), "study", "the Study route selects Study mode");
const triadShapesQuizRoute = createHarness({ search: "?exercise=fretboard.triad_shapes.quiz" });
assert.strictEqual(triadShapesQuizRoute.elements.triadShapesScreen.hidden, false, "the stable Quiz route opens Triad Shapes directly");
assert.strictEqual(triadShapesQuizRoute.api.getTriadShapesMode(), "quiz", "the Quiz route selects Quiz mode");
const directFretboardVoiceRoute = createHarness({ search: "?exercise=fretboard.voice_leading" });
assert.strictEqual(directFretboardVoiceRoute.elements.setupScreen.hidden, false, "the existing direct Voice Leading route remains compatible");
assert.strictEqual(directFretboardVoiceRoute.api.getSelectedMode(), "fretboard-voice", "the direct Voice Leading route still selects Voice Leading");
const pagesChordPracticePath = createHarness({ pathname: "/musicianship-lab/keyboard/chord-practice/" });
assert.strictEqual(pagesChordPracticePath.elements.setupScreen.hidden, false, "the Pages subdirectory Chord Practice path opens directly");
assert.strictEqual(pagesChordPracticePath.api.getSelectedMode(), "play", "the Pages subdirectory Chord Practice path selects Chord Practice");
const pagesFretboardVoicePath = createHarness({ pathname: "/musicianship-lab/fretboard/voice-leading/" });
assert.strictEqual(pagesFretboardVoicePath.elements.setupScreen.hidden, false, "the Pages subdirectory Voice Leading path opens directly");
assert.strictEqual(pagesFretboardVoicePath.api.getSelectedMode(), "fretboard-voice", "the Pages subdirectory Voice Leading path selects Voice Leading");
const pagesTriadStudyPath = createHarness({ pathname: "/musicianship-lab/fretboard/triad-shapes/study/" });
assert.strictEqual(pagesTriadStudyPath.elements.triadShapesScreen.hidden, false, "the Pages subdirectory Triad Shapes Study path opens directly");
assert.strictEqual(pagesTriadStudyPath.api.getTriadShapesMode(), "study", "the Pages subdirectory Triad Shapes Study path selects Study");
const pagesTriadQuizPath = createHarness({ pathname: "/musicianship-lab/fretboard/triad-shapes/quiz/" });
assert.strictEqual(pagesTriadQuizPath.elements.triadShapesScreen.hidden, false, "the Pages subdirectory Triad Shapes Quiz path opens directly");
assert.strictEqual(pagesTriadQuizPath.api.getTriadShapesMode(), "quiz", "the Pages subdirectory Triad Shapes Quiz path selects Quiz");

if (process.env.MUSICIANSHIP_TEST_SCOPE === "triad-shapes") {
  console.log("PASS: Triad Shapes model, Study filters, Quiz interaction, persistence, navigation, and direct routes verified");
  process.exit(0);
}

const expectedScales = {
  "c-major": ["C", "D", "E", "F", "G", "A", "B"],
  "g-major": ["G", "A", "B", "C", "D", "E", "F#"],
  "d-major": ["D", "E", "F#", "G", "A", "B", "C#"],
  "a-major": ["A", "B", "C#", "D", "E", "F#", "G#"],
  "e-major": ["E", "F#", "G#", "A", "B", "C#", "D#"],
  "b-major": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  "f-sharp-major": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
  "d-flat-major": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  "a-flat-major": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  "e-flat-major": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  "b-flat-major": ["Bb", "C", "D", "Eb", "F", "G", "A"],
  "f-major": ["F", "G", "A", "Bb", "C", "D", "E"]
};

assert.deepStrictEqual(Object.keys(api.keys), Object.keys(expectedScales), "exactly the twelve requested major keys are available");
for (const [keyId, expectedScale] of Object.entries(expectedScales)) {
  assert.deepStrictEqual([...api.keys[keyId].scaleNotes], expectedScale, `${api.keys[keyId].displayName} has correct theoretical spelling`);
  assert.strictEqual(new Set(api.keys[keyId].scaleNotes.map(note => note[0])).size, 7, "every scale uses each letter exactly once");
}

function spelledTriad(keyId, degree) {
  return api.keys[keyId].chords.find(item => item.degree === degree).noteNames.join(" ");
}

assert.strictEqual(spelledTriad("e-flat-major", "I"), "Eb G Bb");
assert.strictEqual(spelledTriad("e-flat-major", "ii"), "F Ab C");
assert.strictEqual(spelledTriad("e-flat-major", "IV"), "Ab C Eb");
assert.strictEqual(spelledTriad("e-flat-major", "V"), "Bb D F");
assert.strictEqual(spelledTriad("e-flat-major", "vi"), "C Eb G");

assert.strictEqual(spelledTriad("a-major", "I"), "A C# E");
assert.strictEqual(spelledTriad("a-major", "ii"), "B D F#");
assert.strictEqual(spelledTriad("a-major", "IV"), "D F# A");
assert.strictEqual(spelledTriad("a-major", "V"), "E G# B");
assert.strictEqual(spelledTriad("a-major", "vi"), "F# A C#");

assert.strictEqual(spelledTriad("f-sharp-major", "I"), "F# A# C#");
assert.strictEqual(spelledTriad("f-sharp-major", "ii"), "G# B D#");
assert.strictEqual(spelledTriad("f-sharp-major", "IV"), "B D# F#");
assert.strictEqual(spelledTriad("f-sharp-major", "V"), "C# E# G#");
assert.strictEqual(spelledTriad("f-sharp-major", "vi"), "D# F# A#");

for (const generatedKey of Object.values(api.keys)) {
  for (const currentChord of generatedKey.chords) {
    const voicings = api.generateTriadVoicings(currentChord, generatedKey.range);
    assert.deepStrictEqual(
      [...new Set(voicings.map(voicing => voicing.inversion))],
      [0, 1, 2],
      `${generatedKey.displayName} ${currentChord.degree} generates all three inversions`
    );
    for (const voicing of voicings) {
      assert(voicing.midi[0] < voicing.midi[1] && voicing.midi[1] < voicing.midi[2], "voices remain ordered");
      assert(voicing.midi.every(note => note >= generatedKey.range.min && note <= generatedKey.range.max), "voicings remain within C3–C5");
      assert.strictEqual(api.identifyInversion(currentChord, voicing.midi), voicing.inversionName, "inversion labels remain accurate");
    }
  }

  api.resetPairHistory();
  for (let index = 0; index < 20; index += 1) {
    const exercise = api.generateVoiceExercise(generatedKey);
    assert.strictEqual(exercise.key.id, generatedKey.id, "exercise retains its requested key");
    assert(generatedKey.chords.includes(exercise.startChord), "starting chord comes from the requested key");
    assert(generatedKey.chords.includes(exercise.targetChord), "target chord comes from the requested key");
    assert.notStrictEqual(exercise.startChord.degree, exercise.targetChord.degree, "starting and target chords differ");
  }
}

for (const currentChord of key.chords) {
  const voicings = api.generateTriadVoicings(currentChord, key.range);
  assert.deepStrictEqual(
    [...new Set(voicings.map(voicing => voicing.inversion))],
    [0, 1, 2],
    `${currentChord.name} generates all three inversions`
  );
  for (const voicing of voicings) {
    assert(voicing.midi[0] < voicing.midi[1] && voicing.midi[1] < voicing.midi[2], "voice order never crosses");
    assert(voicing.midi.every(note => note >= key.range.min && note <= key.range.max), "every note stays between C3 and C5");
    assert.strictEqual(api.identifyInversion(currentChord, voicing.midi), voicing.inversionName, "generated inversion is recognized");
  }
}

assert.strictEqual(api.identifyInversion(chord("I"), [60, 64, 67]), "root position");
assert.strictEqual(api.identifyInversion(chord("I"), [52, 55, 60]), "first inversion");
assert.strictEqual(api.identifyInversion(chord("I"), [55, 60, 64]), "second inversion");

const basicMovement = api.calculateVoiceMovement([60, 64, 67], [60, 64, 69]);
assert.deepStrictEqual(basicMovement.voices.map(voice => voice.semitones), [0, 0, 2], "movement compares bass, middle, and top in order");
assert.strictEqual(basicMovement.total, 2, "C E G to C E A totals two semitones");
assert.strictEqual(
  api.calculateVoiceMovement([66, 70, 73], [65, 70, 73]).total,
  1,
  "distance uses sounding MIDI pitch and is independent of whether pitch class 6 is written F# or Gb"
);
assert.strictEqual(api.keys["f-sharp-major"].noteNames[5], "E#", "F-sharp major preserves E-sharp");
assert.strictEqual(api.keys["d-flat-major"].noteNames[6], "Gb", "D-flat major preserves G-flat");

const bestAminor = api.selectBestVoicing([60, 64, 67], api.generateTriadVoicings(chord("vi"), key.range), key);
assert.strictEqual(naturals(bestAminor.midi), "C E A", "C E G → A minor prefers C E A");
assert.strictEqual(bestAminor.movement.total, 2);

const bestFmajor = api.selectBestVoicing([60, 64, 67], api.generateTriadVoicings(chord("IV"), key.range), key);
assert.strictEqual(naturals(bestFmajor.midi), "C F A", "C E G → F major prefers C F A");
assert.strictEqual(bestFmajor.movement.total, 3);

const fFirstInversionMidi = [57, 60, 65];
const aMinorCandidates = api.generateTriadVoicings(chord("vi"), key.range);
assert(
  aMinorCandidates.some(voicing => voicing.midi.join(",") === "57,60,64") &&
  aMinorCandidates.some(voicing => voicing.midi.join(",") === "60,64,69") &&
  aMinorCandidates.some(voicing => voicing.midi.join(",") === "52,57,60"),
  "A-minor candidates include A3–C4–E4, C4–E4–A4, and E3–A3–C4"
);
const fToAMinor = api.selectBestVoicing(
  fFirstInversionMidi,
  aMinorCandidates,
  key
);
assert.deepStrictEqual(
  [...fToAMinor.midi],
  [57, 60, 64],
  "A3–C4–F4 → A minor selects A3–C4–E4, never the 13-semitone E–A–C option"
);
assert.deepStrictEqual(
  fToAMinor.movement.voices
    .filter(voice => voice.semitones === 0)
    .map(voice => voice.from),
  [57, 60],
  "the exact sounding A3 and C4 voices are retained as common tones"
);
assert.strictEqual(
  fToAMinor.movingVoices,
  1,
  "only the F4 voice moves in the required regression case"
);
assert.strictEqual(fToAMinor.movement.total, 1, "the required regression totals one semitone");
assert.notDeepStrictEqual(
  [...fToAMinor.midi],
  [52, 57, 60],
  "the 13-semitone E3–A3–C4 option is rejected"
);

const guardedFToAMinorRoute = api.optimizeProgressionRoute(
  key,
  [chord("vi"), chord("IV"), chord("V"), chord("I")],
  {
    inversion: 1,
    inversionName: "first inversion",
    midi: fFirstInversionMidi
  }
);
assert.deepStrictEqual(
  [...guardedFToAMinorRoute.route[1].midi],
  [57, 60, 64],
  "whole-route planning cannot override the nearest A-minor voicing without an explicit strategy"
);
assert.strictEqual(
  guardedFToAMinorRoute.localMinimumMovement,
  1,
  "the route records the verified local minimum"
);
assert.strictEqual(
  guardedFToAMinorRoute.diagnostics.length,
  aMinorCandidates.length,
  "development diagnostics include every allowed target voicing"
);
assert(
  guardedFToAMinorRoute.diagnostics.every(candidate =>
    "localMovement" in candidate &&
    "commonToneCount" in candidate &&
    "movingVoiceCount" in candidate &&
    "registerPenalty" in candidate &&
    "futureRouteCost" in candidate &&
    Array.isArray(candidate.finalCombinedScore)
  ),
  "candidate diagnostics document local, common-tone, movement, register, future, and combined costs"
);

const aMinorToF = api.selectBestVoicing(
  [57, 60, 64],
  api.generateTriadVoicings(chord("IV"), key.range),
  key
);
assert.deepStrictEqual([...aMinorToF.midi], [57, 60, 65], "A3–C4–E4 → F major selects A3–C4–F4");
assert.strictEqual(aMinorToF.movement.total, 1, "A minor → F major moves one semitone");

const fToG = api.selectBestVoicing(
  fFirstInversionMidi,
  api.generateTriadVoicings(chord("V"), key.range),
  key
);
const fToGMinimum = Math.min(
  ...api.generateTriadVoicings(chord("V"), key.range)
    .map(voicing => api.calculateVoiceMovement(fFirstInversionMidi, voicing.midi).total)
);
assert.strictEqual(fToG.movement.total, fToGMinimum, "F major → G major selects the actual minimum across every inversion");
assert.deepStrictEqual([...fToG.midi], [59, 62, 67], "the deterministic tie-breaker chooses B3–D4–G4 for A3–C4–F4 → G major");

const eMinorToG = api.selectBestVoicing(
  [52, 55, 59],
  api.generateTriadVoicings(chord("V"), key.range),
  key
);
assert.deepStrictEqual([...eMinorToG.midi], [50, 55, 59], "E3–G3–B3 → G major selects D3–G3–B3");
assert.strictEqual(eMinorToG.movement.total, 2, "E minor → G major moves two semitones");

// B3–E4–G4 moves only the bass by one semitone from C4–E4–G4.
// That makes B E G mathematically preferable to root-position E G B (11 semitones total).
const bestEminor = api.selectBestVoicing([60, 64, 67], api.generateTriadVoicings(chord("iii"), key.range), key);
assert.strictEqual(naturals(bestEminor.midi), "B E G", "C E G → E minor prefers B E G");
assert.strictEqual(bestEminor.movement.total, 1);

const commonToneWinner = api.selectBestVoicing([60, 64, 67], [
  { inversion: 0, inversionName: "root position", midi: [59, 65, 68] },
  { inversion: 1, inversionName: "first inversion", midi: [60, 65, 69] }
], key);
assert.deepStrictEqual(commonToneWinner.midi, [60, 65, 69], "tie prefers more common tones before considering largest leap");

const smallerLeapWinner = api.selectBestVoicing([60, 64, 67], [
  { inversion: 0, inversionName: "root position", midi: [60, 65, 71] },
  { inversion: 1, inversionName: "first inversion", midi: [60, 66, 70] }
], key);
assert.deepStrictEqual(smallerLeapWinner.midi, [60, 66, 70], "tie with equal common tones prefers the smaller largest leap");

const centerWinner = api.selectBestVoicing([60, 64, 67], [
  { inversion: 0, inversionName: "root position", midi: [59, 64, 68] },
  { inversion: 1, inversionName: "first inversion", midi: [60, 65, 68] }
], key);
assert.deepStrictEqual(centerWinner.midi, [59, 64, 68], "remaining tie prefers the voicing closer to range center");

const consistentWinner = api.selectBestVoicing([60, 64, 67], [
  { inversion: 2, inversionName: "second inversion", midi: [59, 64, 68] },
  { inversion: 0, inversionName: "root position", midi: [59, 64, 68] }
], key);
assert.strictEqual(consistentWinner.inversion, 0, "final tie is resolved consistently");

api.resetPairHistory();
let priorPair = null;
for (let index = 0; index < 100; index += 1) {
  const exercise = api.generateVoiceExercise(key);
  assert.notStrictEqual(exercise.startChord.degree, exercise.targetChord.degree, "starting and target chords differ");
  assert.notStrictEqual(exercise.pairKey, priorPair, "the same chord pair never repeats immediately");
  priorPair = exercise.pairKey;
}

api.resetPairHistory();
const fSharpMinorTargetExercise = api.generateVoiceExercise(
  api.keys["e-major"],
  () => 0
);
assert.strictEqual(fSharpMinorTargetExercise.targetChord.name, "F# minor", "E-major study generates the theoretically spelled ii chord");
assert.deepStrictEqual(
  [...fSharpMinorTargetExercise.targetChord.noteNames],
  ["F#", "A", "C#"],
  "target chord-note help preserves F# minor root-position spelling"
);

assert.strictEqual(harness.elements.triadInput.value.split(/\r?\n/).filter(Boolean).length, 21, "original 21-item triad list remains intact");
harness.elements.startButton.dispatch("click");
assert.strictEqual(harness.elements.playScreen.hidden, false, "the legacy Triad Trainer mode starts Chord Practice");
assert.strictEqual(harness.api.getCurrentPlayExercise().exerciseId, "keyboard.chord_practice", "the legacy start route uses the consolidated exercise generator");

const guided = createHarness({ mode: "voice", difficulty: "guided", promptStyle: "name" });
guided.modeInputs[1].dispatch("change");
guided.elements.startButton.dispatch("click");
assert.strictEqual(guided.elements.voiceScreen.hidden, false, "Voice-Leading Trainer starts from the mode selector");
assert.strictEqual(guided.api.getVoiceStage(), "stage1", "every exercise begins at Stage 1");
assert.strictEqual(guided.elements.voiceStageOne.dataset.state, "active", "Stage 1 begins visually active");
assert.strictEqual(guided.elements.voiceStageTwo.dataset.state, "locked", "Stage 2 remains inactive before Stage 1 completion");
assert.strictEqual(guided.elements.voiceTargetContent.hidden, true, "Stage 2 target content remains hidden before Stage 1 completion");
assert.strictEqual(guided.elements.voiceAnswer.hidden, true, "optimal target voicing is not revealed at the beginning");
assert.strictEqual(guided.elements.voiceStartIdentity.hidden, false, "starting chord and inversion remain visible");
assert(
  !guided.elements.voiceTargetPrompt.textContent.includes(guided.api.getCurrentExercise().bestTarget.inversionName),
  "the optimal target inversion is not named before the answer"
);
guided.elements.revealButton.dispatch("click");
assert.strictEqual(guided.api.getVoiceStage(), "stage2", "Stage 1 Reveal confirms the starting voicing");
assert.strictEqual(guided.elements.voiceTargetContent.hidden, false, "completing Stage 1 activates the Stage 2 target");
assert.strictEqual(guided.elements.voiceAnswer.hidden, true, "Stage 1 Reveal does not give away the optimal target");
assert(guided.elements.voiceTargetPrompt.textContent.includes("—"), "Stage 2 shows Roman numeral and chord name");
const guidedTargetChord = guided.api.getCurrentExercise().targetChord;
assert.strictEqual(
  guided.elements.voiceTargetChordNotes.textContent,
  `Chord notes: ${guidedTargetChord.noteNames.join(" – ")}`,
  "target chord notes use root-position theoretical spelling"
);
assert.strictEqual(guided.elements.voiceTargetChordNotes.hidden, false, "target chord notes are shown by default");
guided.elements.revealButton.dispatch("click");
assert.strictEqual(guided.elements.voiceAnswer.hidden, false, "Stage 2 Reveal shows the closest voicing");
assert.strictEqual(guided.elements.voiceAnswerEyebrow.textContent, "Best target voicing", "manual Reveal labels the recommendation clearly");
assert.strictEqual(guided.elements.voiceMovementList.children.length, 3, "Reveal lists all three voice movements");
assert(guided.elements.voiceTieResult.textContent, "answer feedback reports whether movement has a tie");
guided.elements.voiceRestartButton.dispatch("click");
assert.strictEqual(guided.api.getVoiceStage(), "stage1", "Reset returns the same exercise to Stage 1");
assert.strictEqual(guided.elements.voiceTargetContent.hidden, true, "Reset locks Stage 2 again");

const hiddenTargetNotesStorage = new Map([
  ["voice-leading-settings", JSON.stringify({ showTargetNotes: "off", revealIncorrect: false })]
]);
const hiddenTargetNotes = createHarness({ mode: "voice" }, hiddenTargetNotesStorage);
hiddenTargetNotes.elements.startButton.dispatch("click");
hiddenTargetNotes.elements.revealButton.dispatch("click");
assert.strictEqual(hiddenTargetNotes.elements.voiceTargetChordNotes.hidden, true, "Show target chord notes Off hides root-position notes");
hiddenTargetNotes.keyDown("n");
assert.strictEqual(hiddenTargetNotes.api.getVoiceStage(), "stage1", "N skips the entire exercise and starts a new Stage 1");
assert.strictEqual(hiddenTargetNotes.elements.voiceAnswer.hidden, true, "the next exercise begins without an answer revealed");

const voiceSettingsStorage = new Map();
const savedVoiceSettings = createHarness({ mode: "voice" }, voiceSettingsStorage);
savedVoiceSettings.elements.voiceShowTargetNotes.value = "off";
savedVoiceSettings.elements.voiceRevealIncorrect.checked = true;
savedVoiceSettings.elements.voiceShowTargetNotes.dispatch("change");
const restoredVoiceSettings = createHarness({}, voiceSettingsStorage);
assert.strictEqual(restoredVoiceSettings.elements.voiceShowTargetNotes.value, "off", "Show target chord notes persists between sessions");
assert.strictEqual(restoredVoiceSettings.elements.voiceRevealIncorrect.checked, true, "Voice-Leading Reveal-on-Incorrect preference persists");

const sharedStorage = new Map();
const keyChange = createHarness({ mode: "voice", difficulty: "guided" }, sharedStorage);
keyChange.elements.startButton.dispatch("click");
assert.strictEqual(keyChange.api.getCurrentExercise().key.id, "c-major", "C major remains the default");
const exerciseBeforeKeyChange = keyChange.api.getCurrentExercise();
keyChange.elements.practiceKeySelect.value = "e-flat-major";
keyChange.elements.practiceKeySelect.dispatch("change");
const eFlatExercise = keyChange.api.getCurrentExercise();
assert.notStrictEqual(eFlatExercise, exerciseBeforeKeyChange, "changing the key immediately generates a new exercise");
assert.strictEqual(eFlatExercise.key.id, "e-flat-major", "new exercise uses the selected key");
assert(eFlatExercise.key.chords.includes(eFlatExercise.startChord), "starting chord belongs to the selected key");
assert(eFlatExercise.key.chords.includes(eFlatExercise.targetChord), "target chord belongs to the selected key");
assert.notStrictEqual(eFlatExercise.startChord.degree, eFlatExercise.targetChord.degree, "selected-key exercise uses different chords");
assert.strictEqual(keyChange.elements.voiceHeaderLabel.textContent, "Voice-Leading Trainer · E-flat major", "practice header updates immediately");
assert.strictEqual(keyChange.elements.voiceStartIdentity.hidden, false, "new-key exercise displays its starting identity");
assert.strictEqual(keyChange.api.getVoiceStage(), "stage1", "changing key restarts at Stage 1");
keyChange.elements.revealButton.dispatch("click");
keyChange.elements.nextExerciseButton.dispatch("click");
assert.strictEqual(keyChange.api.getCurrentExercise().key.id, "e-flat-major", "Next Exercise remains in the selected key");
assert.strictEqual(sharedStorage.get("voice-leading-selected-key"), "e-flat-major", "selected key is saved locally");

const restoredKey = createHarness({ mode: "voice" }, sharedStorage);
assert.strictEqual(restoredKey.api.getSelectedKeyId(), "e-flat-major", "saved key is restored on the next open");
assert.strictEqual(restoredKey.elements.voiceKeySelect.value, "e-flat-major", "setup selector reflects the restored key");

const midiApi = harness.api;
const cMajor = midiApi.keys["c-major"];

function identify(notes, keyContext = null, maximumAlternatives = 8) {
  return midiApi.identifyChordCollection(notes, {
    keyContext,
    noteKey: keyContext || cMajor,
    maximumAlternatives
  });
}

for (const formulaId of [
  "major", "minor", "diminished", "augmented", "sus2", "sus4",
  "add9", "minor-add9", "add11", "six", "minor-six", "six-nine",
  "dominant-seven", "major-seven", "minor-seven", "minor-major-seven",
  "half-diminished-seven", "diminished-seven", "augmented-major-seven",
  "augmented-seven", "nine", "major-nine", "minor-nine", "eleven",
  "minor-eleven", "thirteen", "major-thirteen", "minor-thirteen",
  "seven-flat-five", "seven-sharp-five", "seven-flat-nine",
  "seven-sharp-nine", "seven-sharp-eleven", "seven-flat-thirteen"
]) {
  assert(
    midiApi.chordFormulas.some(formula => formula.id === formulaId),
    `formula vocabulary includes ${formulaId}`
  );
}

const chordRecognitionExamples = [
  { notes: [60, 64, 67], symbol: "C", description: "C major" },
  { notes: [52, 55, 60], symbol: "C/E", description: "C major" },
  { notes: [55, 60, 64], symbol: "C/G", description: "C major" },
  { notes: [57, 60, 64], symbol: "Am", description: "A minor" },
  { notes: [60, 63, 67], symbol: "Cm", description: "C minor" },
  { notes: [60, 65, 67], symbol: "Csus4", description: "C suspended 4" },
  { notes: [60, 62, 67], symbol: "Csus2", description: "C suspended 2" },
  { notes: [60, 64, 67, 70], symbol: "C7", description: "C dominant 7" },
  { notes: [60, 64, 67, 71], symbol: "Cmaj7", description: "C major 7" },
  { notes: [60, 63, 67, 70], symbol: "Cm7", description: "C minor 7" },
  { notes: [60, 63, 66, 70], symbol: "Cm7b5", description: "C half-diminished 7" },
  { notes: [60, 63, 66, 69], symbol: "Cdim7", description: "C diminished 7" },
  { notes: [60, 64, 67, 74], symbol: "Cadd9", description: "C add 9" },
  { notes: [60, 64, 67, 70, 74], symbol: "C9", description: "C dominant 9" },
  { notes: [60, 64, 67, 71, 74], symbol: "Cmaj9", description: "C major 9" },
  { notes: [60, 63, 67, 70, 74], symbol: "Cm9", description: "C minor 9" }
];

for (const example of chordRecognitionExamples) {
  const analysis = identify(example.notes);
  assert(analysis.bestCandidate, `${example.symbol} produces a conventional chord candidate`);
  assert.strictEqual(analysis.bestCandidate.symbol, example.symbol, `${example.notes.join(",")} identifies as ${example.symbol}`);
  assert.strictEqual(analysis.bestCandidate.descriptiveName, example.description, `${example.symbol} has the requested descriptive name`);
}

assert.strictEqual(identify([52, 55, 60]).bestCandidate.inversion, "first inversion", "C/E is labeled first inversion");
assert.strictEqual(identify([55, 60, 64]).bestCandidate.inversion, "second inversion", "C/G is labeled second inversion");
assert.strictEqual(identify([59, 60, 64, 67]).bestCandidate.symbol, "Cmaj7/B", "seventh-chord bass creates Cmaj7/B");
assert.strictEqual(identify([59, 60, 64, 67]).bestCandidate.inversion, "third inversion", "Cmaj7/B is labeled third inversion");

const doubledMajor = identify([48, 55, 60, 64, 67]);
assert.strictEqual(doubledMajor.bestCandidate.symbol, "C", "doublings do not alter C-major identity");
assert.deepStrictEqual([...doubledMajor.doubledNoteNames].sort(), ["C", "G"], "doubled pitch classes are reported separately");
assert.deepStrictEqual([...doubledMajor.playedMidiNotes], [48, 55, 60, 64, 67], "exact MIDI voicing is preserved");
const doubledAddNine = identify([48, 55, 60, 64, 67, 74]);
assert.strictEqual(doubledAddNine.bestCandidate.symbol, "Cadd9", "doubled Cadd9 remains Cadd9");

const ambiguousSix = identify([60, 64, 67, 69]);
assert.strictEqual(ambiguousSix.bestCandidate.symbol, "C6", "C6 is the best interpretation over a C bass");
assert(
  ambiguousSix.alternatives.some(candidate => candidate.symbol === "Am7/C"),
  "Am7/C remains available as a ranked alternate"
);

const omittedFifth = identify([60, 64, 70, 74]);
assert.strictEqual(omittedFifth.bestCandidate.symbol, "C9(no5)", "C E Bb D plausibly identifies C9 without a fifth");
assert.deepStrictEqual([...omittedFifth.bestCandidate.missingTones], ["G"], "omitted fifth is explained");
const omittedThirteen = identify([55, 59, 64, 65]);
assert.strictEqual(omittedThirteen.bestCandidate.symbol, "G13(no5, no9)", "common G13 voicing reports omitted fifth and ninth carefully");

const cContextG = identify([55, 59, 62], cMajor);
assert.strictEqual(cContextG.bestCandidate.symbol, "G", "key context does not alter the actual G-major name");
assert.strictEqual(cContextG.bestCandidate.keyContext.romanNumeral, "V", "G major in C major reports V");
assert.strictEqual(cContextG.bestCandidate.keyContext.status, "diatonic", "G major is diatonic to C major");
const cContextAm7 = identify([57, 60, 64, 67], cMajor);
assert.strictEqual(cContextAm7.bestCandidate.keyContext.romanNumeral, "vi7", "A minor 7 in C major reports vi7");
const gContextG = identify([55, 59, 62], midiApi.keys["g-major"]);
assert.strictEqual(gContextG.bestCandidate.keyContext.romanNumeral, "I", "G major in G major reports I");

const oneNoteAnalysis = identify([60]);
assert.strictEqual(oneNoteAnalysis.kind, "note", "one MIDI note is analyzed as a note rather than forced into a chord");
assert.strictEqual(oneNoteAnalysis.singleNote.name, "C4", "one-note analysis reports note name and octave");
const intervalAnalysis = identify([60, 67]);
assert.strictEqual(intervalAnalysis.kind, "interval", "two notes are analyzed as an interval");
assert.strictEqual(intervalAnalysis.interval.name, "perfect fifth", "C to G reports a perfect fifth");
assert.strictEqual(intervalAnalysis.interval.semitones, 7, "two-note analysis reports semitone distance");
const unclearCollection = identify([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]);
assert.strictEqual(unclearCollection.bestCandidate, null, "large chromatic collection does not receive a nonsensical chord label");
assert.strictEqual(unclearCollection.kind, "collection", "ambiguous clusters retain a useful pitch-collection result");
const gMajorSpelling = identify([54, 57, 60], midiApi.keys["g-major"]);
assert.strictEqual(gMajorSpelling.bestCandidate.symbol, "F#dim", "G-major context spells the leading-tone root as F#");

const gRoot = midiApi.recognizeMidiTriad([55, 59, 62], cMajor);
assert.strictEqual(gRoot.name, "G major");
assert.strictEqual(gRoot.inversionName, "root position");
assert.deepStrictEqual([...gRoot.midi], [55, 59, 62], "recognized MIDI notes remain sorted");

const gFirst = midiApi.recognizeMidiTriad([59, 62, 67], cMajor);
assert.strictEqual(gFirst.name, "G major");
assert.strictEqual(gFirst.inversionName, "first inversion");

const gSecond = midiApi.recognizeMidiTriad([50, 55, 59], cMajor);
assert.strictEqual(gSecond.name, "G major");
assert.strictEqual(gSecond.inversionName, "second inversion");

const gMinor = midiApi.recognizeMidiTriad([55, 58, 62], cMajor);
assert.strictEqual(gMinor.name, "G minor");
assert.strictEqual(gMinor.inversionName, "root position");

const eFlatTriad = midiApi.recognizeMidiTriad([51, 55, 58], midiApi.keys["e-flat-major"]);
assert.deepStrictEqual([...eFlatTriad.noteNames], ["Eb3", "G3", "Bb3"], "MIDI display respects flat-key spelling");
const fSharpDominant = midiApi.recognizeMidiTriad([61, 65, 68], midiApi.keys["f-sharp-major"]);
assert.deepStrictEqual([...fSharpDominant.noteNames], ["C#4", "E#4", "G#4"], "MIDI display preserves E-sharp in F-sharp major");

const expectedGRoot = {
  chordPitchClasses: [7, 11, 2],
  orderedPitchClasses: [7, 11, 2],
  midi: [55, 59, 62]
};
assert.strictEqual(midiApi.compareMidiAnswer([67, 71, 74], expectedGRoot, "chord-notes").correct, true, "Chord Notes accepts another octave");
assert.strictEqual(midiApi.compareMidiAnswer([67, 71, 74], expectedGRoot, "exact-voicing").correct, true, "Exact Voicing accepts another octave");
assert.strictEqual(midiApi.compareMidiAnswer([59, 62, 67], expectedGRoot, "exact-voicing").correct, false, "Exact Voicing rejects wrong inversion");
assert.strictEqual(midiApi.compareMidiAnswer([59, 62, 67], expectedGRoot, "exact-voicing").chordCorrect, true, "wrong inversion is still recognized as the correct chord");
assert.strictEqual(midiApi.compareMidiAnswer([55, 59, 62], expectedGRoot, "exact-register").correct, true, "Exact Register accepts exact MIDI notes");
assert.strictEqual(midiApi.compareMidiAnswer([67, 71, 74], expectedGRoot, "exact-register").correct, false, "Exact Register rejects another octave");
assert.strictEqual(midiApi.compareMidiAnswer([55, 58, 62], expectedGRoot, "chord-notes").correct, false, "G minor is not accepted for G major");

const expectedGFirst = {
  chordPitchClasses: [7, 11, 2],
  orderedPitchClasses: [11, 2, 7],
  midi: [59, 62, 67]
};
assert.strictEqual(midiApi.compareMidiAnswer([59, 62, 67], expectedGFirst, "exact-voicing").correct, true, "G major first inversion is accepted");
assert.strictEqual(midiApi.compareMidiAnswer([47, 50, 55], expectedGFirst, "exact-voicing").correct, true, "first inversion is accepted in another octave");
assert.strictEqual(midiApi.compareMidiAnswer([55, 59, 62], expectedGFirst, "exact-voicing").correct, false, "root position is rejected when first inversion is requested");

const tracker = createHarness();
assert.strictEqual(tracker.api.evaluateHeldMidiNotes().reason, "waiting", "zero notes do not evaluate");
tracker.api.processMidiMessageData([0x90, 64, 100]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [64], "note-on adds an active note");
tracker.api.processMidiMessageData([0x90, 60, 100]);
tracker.api.processMidiMessageData([0x9F, 67, 100]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [60, 64, 67], "notes from all channels are sorted low to high");
tracker.api.processMidiMessageData([0x90, 64, 100]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [60, 64, 67], "repeated note-on does not duplicate a note");
assert.strictEqual(tracker.api.getLastEvaluatedMidiSignature(), "", "three notes wait for the settling window");
tracker.advance(tracker.api.getMidiSettleMs() - 1);
assert.strictEqual(tracker.api.getLastEvaluatedMidiSignature(), "", "evaluation does not occur early");
tracker.advance(1);
assert.strictEqual(tracker.api.getLastEvaluatedMidiSignature(), "60,64,67", "evaluation occurs after the settling window");
assert.strictEqual(tracker.api.evaluateHeldMidiNotes().reason, "duplicate", "one held chord is not evaluated twice");
tracker.api.processMidiMessageData([0x90, 64, 0]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [60, 67], "velocity-zero note-on is treated as note-off");
assert.strictEqual(tracker.api.getLastEvaluatedMidiSignature(), "", "releasing below three notes permits a new attempt");
tracker.api.processMidiMessageData([0x80, 60, 0]);
tracker.api.processMidiMessageData([0x80, 67, 0]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [], "note-off clears active notes");

tracker.api.processMidiMessageData([0x90, 60, 100]);
tracker.api.processMidiMessageData([0x90, 64, 100]);
assert.strictEqual(tracker.api.evaluateHeldMidiNotes().reason, "waiting", "one or two notes are not evaluated");
tracker.api.processMidiMessageData([0x90, 67, 100]);
tracker.api.processMidiMessageData([0x90, 72, 100]);
assert.strictEqual(tracker.api.evaluateHeldMidiNotes().reason, "extra-notes", "more than three held notes pauses evaluation");
assert.strictEqual(tracker.elements.triadMidiFeedback.textContent, "Release extra notes");
tracker.api.resetMidiState();

tracker.elements.midiUseSustain.checked = true;
tracker.api.processMidiMessageData([0x90, 60, 100]);
tracker.api.processMidiMessageData([0xB0, 64, 127]);
tracker.api.processMidiMessageData([0x80, 60, 0]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [60], "sustain capture retains a released note when enabled");
tracker.api.processMidiMessageData([0xB0, 64, 0]);
assert.deepStrictEqual([...tracker.api.getActiveMidiNotes()], [], "pedal release clears sustained notes");

function closedVoicingForPitchClasses(pitchClasses, minimum = 48) {
  const result = [];
  let cursor = minimum;
  for (const pitchClass of pitchClasses) {
    while (((cursor % 12) + 12) % 12 !== pitchClass) cursor += 1;
    result.push(cursor);
    cursor += 1;
  }
  return result;
}

function playMidiChord(testHarness, midiNotes) {
  for (const note of midiNotes) testHarness.api.processMidiMessageData([0x90, note, 100]);
  testHarness.advance(testHarness.api.getMidiSettleMs());
}

function releaseMidiChord(testHarness, midiNotes) {
  for (const note of midiNotes) testHarness.api.processMidiMessageData([0x80, note, 0]);
}

const identifierUi = createHarness({ mode: "identifier" });
identifierUi.elements.startButton.dispatch("click");
assert.strictEqual(identifierUi.elements.identifierScreen.hidden, false, "Chord Identifier starts from the top-level mode selector");
assert.strictEqual(identifierUi.elements.identifierSymbol.textContent, "Listening…", "identifier begins in a clear listening state");
assert.strictEqual(identifierUi.elements.identifierSaveButton.disabled, true, "nothing can be saved before a chord is identified");
playMidiChord(identifierUi, [60, 64, 67]);
assert.strictEqual(identifierUi.api.getCurrentIdentifierAnalysis().bestCandidate.symbol, "C", "live MIDI identifies C major");
assert.strictEqual(identifierUi.elements.identifierSymbol.textContent, "C", "main result displays the best chord symbol");
assert.strictEqual(identifierUi.elements.identifierDescription.textContent, "C major — root position", "main result displays descriptive name and inversion");
assert.strictEqual(identifierUi.elements.identifierPlayedNotes.textContent, "C – E – G", "main result displays played notes");
assert.strictEqual(identifierUi.elements.identifierSaveButton.disabled, false, "identified chords can be saved");
assert.strictEqual(identifierUi.elements.identifierAlternatives.hidden, true, "a clear chord match does not show unnecessary alternatives");

identifierUi.api.processMidiMessageData([0x90, 74, 100]);
identifierUi.advance(109);
assert.strictEqual(identifierUi.api.getCurrentIdentifierAnalysis().bestCandidate.symbol, "C", "stabilization window defers analysis during near-simultaneous input");
identifierUi.advance(1);
assert.strictEqual(identifierUi.api.getCurrentIdentifierAnalysis().bestCandidate.symbol, "Cadd9", "adding D updates C major to Cadd9 after stabilization");
identifierUi.api.processMidiMessageData([0x80, 74, 0]);
identifierUi.advance(110);
assert.strictEqual(identifierUi.api.getCurrentIdentifierAnalysis().bestCandidate.symbol, "C", "removing a note updates the analysis");
releaseMidiChord(identifierUi, [60, 64, 67]);
identifierUi.advance(110);
assert.strictEqual(identifierUi.api.getCurrentIdentifierAnalysis().bestCandidate.symbol, "C", "Hold Last Result retains the analysis after release");
assert(identifierUi.elements.identifierStatus.textContent.includes("held"), "held-result status is explained");

const identifierNoHold = createHarness({ mode: "identifier" });
identifierNoHold.elements.identifierHoldLast.value = "off";
identifierNoHold.elements.startButton.dispatch("click");
playMidiChord(identifierNoHold, [60, 64, 67]);
releaseMidiChord(identifierNoHold, [60, 64, 67]);
identifierNoHold.advance(110);
assert.strictEqual(identifierNoHold.api.getCurrentIdentifierAnalysis().kind, "empty", "Hold Last Result Off clears analysis when all keys are released");
assert.strictEqual(identifierNoHold.elements.identifierSymbol.textContent, "Listening…", "cleared analysis returns to Listening");

const identifierSustain = createHarness({ mode: "identifier" });
identifierSustain.elements.identifierFollowSustain.value = "on";
identifierSustain.elements.startButton.dispatch("click");
playMidiChord(identifierSustain, [60, 64, 67]);
identifierSustain.api.processMidiMessageData([0xB0, 64, 127]);
releaseMidiChord(identifierSustain, [60, 64, 67]);
assert.deepStrictEqual([...identifierSustain.api.getActiveMidiNotes()], [60, 64, 67], "Follow Sustain retains released sounding notes separately from key-down state");
identifierSustain.api.processMidiMessageData([0xB0, 64, 0]);
identifierSustain.advance(110);
assert.deepStrictEqual([...identifierSustain.api.getActiveMidiNotes()], [], "releasing sustain removes sustained notes");

const identifierNoSustain = createHarness({ mode: "identifier" });
identifierNoSustain.elements.identifierFollowSustain.value = "off";
identifierNoSustain.elements.startButton.dispatch("click");
playMidiChord(identifierNoSustain, [60, 64, 67]);
identifierNoSustain.api.processMidiMessageData([0xB0, 64, 127]);
releaseMidiChord(identifierNoSustain, [60, 64, 67]);
assert.deepStrictEqual([...identifierNoSustain.api.getActiveMidiNotes()], [], "Follow Sustain Off ignores pedal-held notes");

const identifierSettingsStorage = new Map();
const identifierSettingsSaved = createHarness({ mode: "identifier" }, identifierSettingsStorage);
identifierSettingsSaved.elements.identifierHoldLast.value = "off";
identifierSettingsSaved.elements.identifierFollowSustain.value = "on";
identifierSettingsSaved.elements.identifierKeyContext.value = "e-flat-major";
identifierSettingsSaved.elements.identifierShowAnalysis.value = "on";
identifierSettingsSaved.elements.identifierShowAlternates.value = "off";
identifierSettingsSaved.elements.identifierMaximumAlternates.value = "8";
identifierSettingsSaved.elements.identifierHoldLast.dispatch("change");
const identifierSettingsRestored = createHarness({}, identifierSettingsStorage);
assert.strictEqual(identifierSettingsRestored.elements.identifierHoldLast.value, "off", "Hold Last Result persists");
assert.strictEqual(identifierSettingsRestored.elements.identifierFollowSustain.value, "on", "Follow Sustain Pedal persists");
assert.strictEqual(identifierSettingsRestored.elements.identifierKeyContext.value, "e-flat-major", "Key Context persists");
assert.strictEqual(identifierSettingsRestored.elements.identifierShowAnalysis.value, "on", "Analysis visibility persists");
assert.strictEqual(identifierSettingsRestored.elements.identifierShowAlternates.value, "off", "alternate visibility persists");
assert.strictEqual(identifierSettingsRestored.elements.identifierMaximumAlternates.value, "8", "maximum candidate count persists");
assert.strictEqual(identifierSettingsRestored.api.getSelectedMode(), "identifier", "Chord Identifier mode persists");
identifierSettingsRestored.elements.startButton.dispatch("click");
assert.strictEqual(identifierSettingsRestored.elements.identifierAnalysisDetails.open, false, "legacy analysis visibility data is preserved but no longer forces the Analysis disclosure open");

const favoriteStorage = new Map();
const favoriteHarness = createHarness({ mode: "identifier" }, favoriteStorage);
favoriteHarness.elements.startButton.dispatch("click");
playMidiChord(favoriteHarness, [60, 64, 67, 69]);
const favoriteAnalysis = favoriteHarness.api.getCurrentIdentifierAnalysis();
const alternateAm7 = favoriteAnalysis.alternatives.find(candidate => candidate.symbol === "Am7/C");
assert(alternateAm7, "ambiguous live analysis exposes Am7/C before saving");
assert.strictEqual(favoriteHarness.elements.identifierAlternatives.hidden, false, "meaningfully ambiguous chords automatically show Also possible");
const alternateButton = favoriteHarness.elements.identifierCandidateList.children.find(button =>
  button.children[0].textContent === "Am7/C"
);
alternateButton.dispatch("click");
assert.strictEqual(favoriteHarness.elements.identifierSymbol.textContent, "Am7/C", "clicking an alternate makes it the active interpretation");
favoriteHarness.elements.identifierSaveButton.dispatch("click");
assert.strictEqual(favoriteHarness.elements.saveChordCandidate.value, alternateAm7.id, "save panel defaults to the selected alternate interpretation");
favoriteHarness.elements.saveChordTitle.value = "Dreamy chorus voicing";
favoriteHarness.elements.saveChordNote.value = "Works well before Abmaj7";
favoriteHarness.elements.saveChordConfirmButton.dispatch("click");
let savedFavorites = favoriteHarness.api.getFavoriteChords();
assert.strictEqual(savedFavorites.length, 1, "Save Chord adds one favorite");
assert.strictEqual(savedFavorites[0].preferredSymbol, "Am7/C", "chosen alternate interpretation becomes the saved preferred name");
assert.strictEqual(savedFavorites[0].selectedAlternateInterpretation, true, "favorite records alternate-interpretation selection");
assert.strictEqual(savedFavorites[0].customTitle, "Dreamy chorus voicing", "favorite stores custom title");
assert.strictEqual(savedFavorites[0].note, "Works well before Abmaj7", "favorite stores optional note");
assert.strictEqual(savedFavorites[0].saveExactVoicing, true, "exact voicing is the default");
assert.deepStrictEqual([...savedFavorites[0].exactMidiNotes], [60, 64, 67, 69], "favorite stores exact MIDI voicing");
assert.strictEqual(savedFavorites[0].libraryId, "chord_library.favorites", "favorite uses the stable library ID");

const restoredFavoriteHarness = createHarness({ mode: "identifier" }, favoriteStorage);
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords().length, 1, "favorites reload from browser storage");
const restoredFavoriteId = restoredFavoriteHarness.api.getFavoriteChords()[0].id;
restoredFavoriteHarness.api.updateFavoriteChord(restoredFavoriteId, {
  customTitle: "Renamed voicing",
  note: "Updated note"
});
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords()[0].customTitle, "Renamed voicing", "favorite can be renamed");
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords()[0].note, "Updated note", "favorite note can be edited");
restoredFavoriteHarness.api.duplicateFavoriteChord(restoredFavoriteId, 5000);
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords().length, 2, "favorite can be duplicated");
assert.strictEqual(
  restoredFavoriteHarness.api.favoriteMatchesMidi(
    restoredFavoriteHarness.api.getFavoriteChords().find(favorite => favorite.id === restoredFavoriteId),
    [60, 64, 67, 69]
  ),
  true,
  "Play to Match accepts the saved exact voicing"
);
assert.strictEqual(
  restoredFavoriteHarness.api.favoriteMatchesMidi(
    restoredFavoriteHarness.api.getFavoriteChords().find(favorite => favorite.id === restoredFavoriteId),
    [48, 52, 55, 57]
  ),
  false,
  "exact-voicing favorite rejects another register"
);

const identityOnlyFavorite = midiApi.createFavoriteChord(
  identify([60, 64, 67]),
  identify([60, 64, 67]).bestCandidate,
  { saveExactVoicing: false },
  6000
);
assert.strictEqual(identityOnlyFavorite.exactMidiNotes.length, 0, "identity-only favorite omits exact MIDI notes");
assert.strictEqual(midiApi.favoriteMatchesMidi(identityOnlyFavorite, [48, 52, 55]), true, "identity-only Play to Match accepts another register");

restoredFavoriteHarness.elements.startButton.dispatch("click");
restoredFavoriteHarness.elements.identifierFavoritesButton.dispatch("click");
assert.strictEqual(restoredFavoriteHarness.elements.favoritesScreen.hidden, false, "Favorite Chords opens as a dedicated view");
assert.strictEqual(restoredFavoriteHarness.elements.favoritesList.children.length, 2, "favorite library renders persisted cards");
restoredFavoriteHarness.elements.favoritesSearch.value = "no such favorite";
restoredFavoriteHarness.elements.favoritesSearch.dispatch("input");
assert.strictEqual(restoredFavoriteHarness.elements.favoritesList.children.length, 0, "favorite search filters the library");
restoredFavoriteHarness.elements.favoritesSearch.value = "";
restoredFavoriteHarness.elements.favoritesSearch.dispatch("input");
restoredFavoriteHarness.elements.favoritesFilter.value = "seventh";
restoredFavoriteHarness.elements.favoritesFilter.dispatch("change");
assert.strictEqual(restoredFavoriteHarness.elements.favoritesList.children.length, 2, "favorite category filter includes seventh chords");
restoredFavoriteHarness.elements.favoritesFilter.value = "major";
restoredFavoriteHarness.elements.favoritesFilter.dispatch("change");
assert.strictEqual(restoredFavoriteHarness.elements.favoritesList.children.length, 0, "favorite category filter excludes non-major categories");
restoredFavoriteHarness.elements.favoritesFilter.value = "all";
restoredFavoriteHarness.elements.favoritesFilter.dispatch("change");
const firstFavoriteCard = restoredFavoriteHarness.elements.favoritesList.children[0];
const firstFavoriteActions = firstFavoriteCard.children[firstFavoriteCard.children.length - 1];
firstFavoriteActions.children[0].dispatch("click");
assert.strictEqual(restoredFavoriteHarness.elements.favoriteDetail.hidden, false, "favorite can be opened");
restoredFavoriteHarness.elements.favoriteEditTitle.value = "UI rename";
restoredFavoriteHarness.elements.favoriteEditNote.value = "UI note edit";
restoredFavoriteHarness.elements.favoriteUpdateButton.dispatch("click");
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords()[0].customTitle, "UI rename", "opened favorite can be renamed in the library");
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords()[0].note, "UI note edit", "opened favorite note can be edited in the library");
restoredFavoriteHarness.elements.favoritePlayMatchButton.dispatch("click");
playMidiChord(restoredFavoriteHarness, restoredFavoriteHarness.api.getFavoriteChords()[0].exactMidiNotes);
assert.strictEqual(restoredFavoriteHarness.elements.favoriteMatchFeedback.textContent, "✓ Match", "Favorite Play to Match confirms a recreated voicing");

const deleteId = restoredFavoriteHarness.api.getFavoriteChords()[0].id;
assert.strictEqual(restoredFavoriteHarness.api.deleteFavoriteChord(deleteId, true), true, "confirmed deletion removes a favorite");
assert.strictEqual(restoredFavoriteHarness.api.getFavoriteChords().length, 1, "only the selected favorite is deleted");
const invalidFavoriteStorage = new Map([
  ["chord-library-favorites", JSON.stringify([{ id: 42 }, null, { preferredSymbol: "C" }])]
]);
const invalidFavoriteHarness = createHarness({ mode: "identifier" }, invalidFavoriteStorage);
assert.strictEqual(invalidFavoriteHarness.api.getFavoriteChords().length, 0, "invalid saved favorite data is ignored safely");

const triadMidi = createHarness({ mode: "triad" });
triadMidi.elements.startButton.dispatch("click");
const triadLegacyExercise = triadMidi.api.getCurrentPlayExercise();
const triadPlayedMidi = closedVoicingForPitchClasses(
  triadMidi.api.expectedPlayAnswer(triadLegacyExercise).orderedPitchClasses
);
playMidiChord(triadMidi, triadPlayedMidi);
assert(triadMidi.elements.playMidiFeedback.textContent.startsWith("✓ Correct"), "legacy Triad Trainer route uses Chord Practice grading");
assert(/\d/.test(triadMidi.elements.playMidiHeld.textContent), "held-note display includes octave numbers");
const triadBeforeStay = triadMidi.api.getCurrentPlayExercise().promptKey;
triadMidi.advance(799);
assert.strictEqual(triadMidi.api.getCurrentPlayExercise().promptKey, triadBeforeStay, "Stay on exercise is the default");
releaseMidiChord(triadMidi, triadPlayedMidi);

const triadAuto = createHarness({ mode: "triad" });
triadAuto.elements.midiAutoAdvance.checked = true;
triadAuto.elements.startButton.dispatch("click");
const triadAutoExercise = triadAuto.api.getCurrentPlayExercise();
const autoPlayedMidi = closedVoicingForPitchClasses(
  triadAuto.api.expectedPlayAnswer(triadAutoExercise).orderedPitchClasses
);
const autoPromptBefore = triadAutoExercise.promptKey;
playMidiChord(triadAuto, autoPlayedMidi);
triadAuto.advance(800);
assert.notStrictEqual(triadAuto.api.getCurrentPlayExercise().promptKey, autoPromptBefore, "optional auto-advance moves to another Chord Practice exercise");
releaseMidiChord(triadAuto, autoPlayedMidi);

const cProgression = midiApi.generateGuidedProgression(
  midiApi.keys["c-major"],
  ["I", "vi", "IV", "V"],
  () => 0
);
assert.deepStrictEqual([...cProgression.degrees], ["I", "vi", "IV", "V"], "progression construction preserves the selected degrees");
assert.strictEqual(cProgression.plan.route.length, 4, "whole-route optimization chooses one voicing for every chord");
assert.deepStrictEqual(
  [...cProgression.plan.route].map(voicing =>
    voicing.midi.map(note => cProgression.key.noteNames[note % 12]).join(" ")
  ),
  ["C E G", "C E A", "C F A", "D G B"],
  "C major I–vi–IV–V produces the expected smooth voice-leading path"
);
assert.deepStrictEqual(
  [...cProgression.plan.transitions].map(transition => transition.movement.total),
  [2, 1, 6],
  "C major progression movement is calculated at every transition"
);
assert.strictEqual(cProgression.plan.cost.totalMovement, 9, "cumulative optimized movement is accurate");

const fToAMinorExercise = midiApi.generateGuidedProgression(
  midiApi.keys["c-major"],
  ["IV", "vi", "IV", "V"],
  () => 0,
  {
    inversion: 1,
    inversionName: "first inversion",
    midi: [57, 60, 65]
  }
);
const voiceLeadingSafeguardUi = createHarness({ mode: "voice" });
voiceLeadingSafeguardUi.api.renderGuidedProgression(fToAMinorExercise);
voiceLeadingSafeguardUi.elements.voiceScreen.hidden = false;
voiceLeadingSafeguardUi.elements.revealButton.dispatch("click");
assert.deepStrictEqual(
  [...voiceLeadingSafeguardUi.api.getVoiceProgressionPlan().route[1].midi],
  [57, 60, 64],
  "the UI safeguard verifies A3–C4–E4 before displaying the A-minor recommendation"
);
assert.strictEqual(
  voiceLeadingSafeguardUi.api.getVoiceProgressionPlan().recommendationCheck.hasLowerCandidate,
  false,
  "the displayed recommendation has no lower-movement valid candidate"
);
assert.strictEqual(
  voiceLeadingSafeguardUi.elements.voiceRouteAnalysisDetails.hidden,
  true,
  "normal practice stays uncluttered when the nearest local voicing is selected"
);

const voiceLeadingDebugUi = createHarness({ mode: "voice", voiceDebug: true });
voiceLeadingDebugUi.api.renderGuidedProgression(
  midiApi.generateGuidedProgression(
    midiApi.keys["c-major"],
    ["IV", "vi", "IV", "V"],
    () => 0,
    {
      inversion: 1,
      inversionName: "first inversion",
      midi: [57, 60, 65]
    }
  )
);
voiceLeadingDebugUi.elements.voiceScreen.hidden = false;
voiceLeadingDebugUi.elements.revealButton.dispatch("click");
assert.strictEqual(
  voiceLeadingDebugUi.elements.voiceRouteAnalysisDetails.hidden,
  false,
  "development mode exposes route-choice diagnostics"
);
assert(
  voiceLeadingDebugUi.elements.voiceRouteDiagnostics.textContent.includes("A3 – C4 – E4") &&
  voiceLeadingDebugUi.elements.voiceRouteDiagnostics.textContent.includes("local=1") &&
  voiceLeadingDebugUi.elements.voiceRouteDiagnostics.textContent.includes("future=") &&
  voiceLeadingDebugUi.elements.voiceRouteDiagnostics.textContent.includes("score=["),
  "development diagnostics display candidate voicings and every requested score component"
);

const futureRouteExplanationUi = createHarness({ mode: "voice" });
futureRouteExplanationUi.api.renderVoiceRouteAnalysis(
  {
    chosenForFutureRoute: true,
    cost: { totalMovement: 18 },
    diagnostics: []
  },
  { key: midiApi.keys["c-major"] },
  { chosenMovement: { total: 4 } }
);
assert.strictEqual(
  futureRouteExplanationUi.elements.voiceRouteAnalysisDetails.hidden,
  false,
  "a deliberately non-local whole-route choice exposes analysis details"
);
assert(
  futureRouteExplanationUi.elements.voiceRouteAnalysisExplanation.textContent.includes(
    "Chosen for smoother total progression path"
  ) &&
  futureRouteExplanationUi.elements.voiceRouteAnalysisExplanation.textContent.includes(
    "Local movement: 4 semitones"
  ) &&
  futureRouteExplanationUi.elements.voiceRouteAnalysisExplanation.textContent.includes(
    "Projected total route movement: 18 semitones"
  ),
  "analysis details explain local and projected movement without calling the choice nearest"
);

const greedyPath = [cProgression.startVoicing];
let greedyTotal = 0;
for (const targetChord of cProgression.chords.slice(1)) {
  const next = midiApi.selectBestVoicing(
    greedyPath[greedyPath.length - 1].midi,
    midiApi.generateTriadVoicings(targetChord, cProgression.key.range),
    cProgression.key
  );
  greedyTotal += next.movement.total;
  greedyPath.push(next);
}
assert(cProgression.plan.cost.totalMovement <= greedyTotal, "whole-progression optimization is never worse than greedy movement for the representative progression");
assert(cProgression.plan.route.every(voicing =>
  voicing.midi[0] < voicing.midi[1] &&
  voicing.midi[1] < voicing.midi[2] &&
  voicing.midi.every(note => note >= cProgression.key.range.min && note <= cProgression.key.range.max)
), "optimized routes preserve voice order and prevent register drift outside the preferred range");

const eFlatProgression = midiApi.generateGuidedProgression(
  midiApi.keys["e-flat-major"],
  ["I", "IV", "ii", "V", "I"],
  () => 0
);
assert.deepStrictEqual(
  [...eFlatProgression.chords].map(item => item.noteNames.join(" ")),
  ["Eb G Bb", "Ab C Eb", "F Ab C", "Bb D F", "Eb G Bb"],
  "E-flat major I–IV–ii–V–I preserves correct flat spelling"
);
const bProgression = midiApi.generateGuidedProgression(
  midiApi.keys["b-major"],
  ["vi", "IV", "I", "V"],
  () => 0
);
assert.deepStrictEqual(
  [...bProgression.chords].map(item => item.noteNames.join(" ")),
  ["G# B D#", "E G# B", "B D# F#", "F# A# C#"],
  "B major vi–IV–I–V preserves correct sharp spelling"
);
assert(bProgression.plan.route.every(voicing =>
  voicing.midi.every(note => note >= bProgression.key.range.min && note <= bProgression.key.range.max)
), "B-major optimized voicings remain in the stable keyboard range");

const noRepeatRandom = midiApi.generateRandomVoiceProgression(
  8,
  ["I", "ii", "IV"],
  false,
  () => 0
);
assert.strictEqual(noRepeatRandom.length, 8, "random progression respects selected length");
assert(noRepeatRandom.every((degree, index) =>
  index === 0 || degree !== noRepeatRandom[index - 1]
), "random progression avoids immediate repetition by default");
const repeatedRandom = midiApi.generateRandomVoiceProgression(4, ["I"], true, () => 0);
assert.deepStrictEqual([...repeatedRandom], ["I", "I", "I", "I"], "intentional repeated chords remain supported");
assert.deepStrictEqual(
  [...midiApi.voiceProgressionPresets["ii-V-I"]],
  ["ii", "V", "I"],
  "common progression presets store transposable diatonic degrees"
);

const progressionBuilder = createHarness({ mode: "voice" });
progressionBuilder.elements.voiceExerciseType.value = "progression";
progressionBuilder.elements.voiceExerciseType.dispatch("change");
assert.strictEqual(progressionBuilder.elements.voiceProgressionSettings.hidden, false, "Guided Progression reveals its own focused settings");
const builderOriginal = progressionBuilder.api.getVoiceProgressionSequence();
progressionBuilder.elements.voiceProgressionAddChord.value = "I";
progressionBuilder.elements.voiceProgressionAddButton.dispatch("click");
assert.strictEqual(progressionBuilder.api.getVoiceProgressionSequence().length, builderOriginal.length + 1, "Choose Chords can add and repeat a chord");
progressionBuilder.api.moveVoiceProgressionChord(builderOriginal.length, -1);
assert.strictEqual(progressionBuilder.api.getVoiceProgressionSequence().at(-2), "I", "Choose Chords can reorder a chord");
progressionBuilder.api.removeVoiceProgressionChord(builderOriginal.length - 1);
assert.strictEqual(progressionBuilder.api.getVoiceProgressionSequence().length, builderOriginal.length, "Choose Chords can remove a chord");
progressionBuilder.elements.voiceProgressionClearButton.dispatch("click");
assert.strictEqual(progressionBuilder.api.getVoiceProgressionSequence().length, 0, "Choose Chords can clear the sequence");
progressionBuilder.elements.voiceProgressionAddChord.value = "I";
progressionBuilder.elements.voiceProgressionAddButton.dispatch("click");
progressionBuilder.elements.voiceProgressionAddChord.value = "I";
progressionBuilder.elements.voiceProgressionAddButton.dispatch("click");
assert.deepStrictEqual([...progressionBuilder.api.getVoiceProgressionSequence()], ["I", "I"], "Choose Chords allows an intentional repeated-chord progression");

const progressionStorage = new Map([
  ["voice-leading-settings", JSON.stringify({
    exerciseType: "progression",
    progressionSource: "common",
    commonProgression: "I-vi-IV-V",
    progressionGuidance: "training",
    assistLevel: "full",
    progressionLength: 5,
    allowRepeats: true,
    enabledChords: ["I", "IV", "V", "vi"],
    progressionSequence: ["I", "IV", "I"],
    showTargetNotes: "on",
    revealIncorrect: false
  })]
]);
const progressionUi = createHarness({ mode: "voice" }, progressionStorage);
assert.strictEqual(progressionUi.elements.voiceExerciseType.value, "progression", "progression exercise type persists");
assert.strictEqual(progressionUi.elements.voiceProgressionSource.value, "common", "progression source persists");
assert.strictEqual(progressionUi.elements.voiceProgressionGuidance.value, "training", "progression guidance persists");
assert.strictEqual(progressionUi.elements.voiceAssistLevel.value, "full", "assist level persists");
assert.strictEqual(progressionUi.elements.voiceProgressionLength.value, "5", "random sequence length persists");
assert.strictEqual(progressionUi.elements.voiceProgressionAllowRepeats.checked, true, "repeat preference persists");
progressionUi.elements.startButton.dispatch("click");
const liveProgression = progressionUi.api.getCurrentExercise();
assert.strictEqual(liveProgression.type, "progression", "Guided Progression starts inside Voice Leading");
assert.deepStrictEqual([...liveProgression.degrees], ["I", "vi", "IV", "V"], "selected common progression is transposed through the active key");
assert.strictEqual(progressionUi.api.getVoiceStage(), "stage1", "progression begins with the existing Stage 1 starting-voicing flow");
playMidiChord(progressionUi, liveProgression.startVoicing.midi);
assert.strictEqual(progressionUi.api.getVoiceStage(), "stage2", "correct starting voicing activates progression Stage 2");
assert.strictEqual(progressionUi.elements.voiceProgressionPosition.textContent, "Chord 2 of 4", "progression clearly displays its current position");
assert.strictEqual(progressionUi.elements.voiceProgressionTrack.children.length, 4, "the full progression is shown with a highlighted position");
assert.strictEqual(progressionUi.elements.voiceProgressionAssist.hidden, false, "Training Assist displays guidance");
assert.strictEqual(
  progressionUi.elements.voiceAssistPlay.textContent,
  progressionUi.api.getVoiceProgressionPlan().route[1].midi
    .map(note => liveProgression.key.noteNames[note % 12]).join(" – "),
  "Full assistance displays the optimized target voicing"
);
releaseMidiChord(progressionUi, liveProgression.startVoicing.midi);
const firstProgressionTarget = progressionUi.api.getVoiceProgressionPlan().route[1].midi;
playMidiChord(progressionUi, firstProgressionTarget);
assert.strictEqual(progressionUi.api.getVoiceProgressionStep(), 2, "a correct target advances exactly one progression step");
assert.deepStrictEqual(
  [...progressionUi.api.getVoiceProgressionPlayedPath()[1].midi],
  [...firstProgressionTarget],
  "the played target becomes the next starting voicing"
);
assert.deepStrictEqual(
  [...progressionUi.api.getVoiceProgressionPlan().route[0].midi],
  [...firstProgressionTarget],
  "the remaining whole-route plan is recalculated from the actual played voicing"
);
releaseMidiChord(progressionUi, firstProgressionTarget);
while (progressionUi.api.getVoiceStage() !== "complete") {
  const target = progressionUi.api.getVoiceProgressionPlan().route[1].midi;
  playMidiChord(progressionUi, target);
  releaseMidiChord(progressionUi, target);
}
assert.strictEqual(progressionUi.elements.voiceProgressionSummary.hidden, false, "the summary appears only after the full progression is completed");
assert.strictEqual(progressionUi.elements.voiceProgressionSummaryPath.children.length, 4, "summary lists every chord and played voicing");
assert.strictEqual(progressionUi.elements.voiceProgressionSummaryKey.textContent, "Key: C major", "completed practice list keeps the key visible");
const completedMovements = progressionUi.api.getVoiceProgressionMovements();
const completedTotal = completedMovements.reduce((sum, movement) => sum + movement.total, 0);
assert(progressionUi.elements.voiceProgressionSummaryStats.textContent.includes(`${completedTotal} semitones`), "summary reports accurate cumulative movement");
assert.strictEqual(progressionUi.api.getVoiceProgressionStats().progressionsCompleted, 1, "one completed progression counts as one exercise");
assert.strictEqual(progressionUi.api.getVoiceProgressionStats().transitionsCompleted, 3, "progression statistics count completed transitions separately");
const completedPractice = progressionUi.api.getCompletedVoiceProgression();
const completedRouteMidi = completedPractice.route.map(voicing => [...voicing.midi]);
assert.deepStrictEqual(
  completedRouteMidi,
  progressionUi.api.getVoiceProgressionPlayedPath().map(voicing => [...voicing.midi]),
  "the practice list stores the exact route the player actually completed"
);
progressionUi.elements.voiceProgressionSummaryPath.children.forEach((row, index) => {
  const chord = completedPractice.chords[index];
  assert.strictEqual(row.children[0].textContent, String(index + 1), "each practice row has a sequence number");
  assert(
    row.children[1].textContent.includes(progressionUi.api.identifyInversion(chord, completedRouteMidi[index])),
    "each practice row identifies the performed inversion"
  );
  assert.strictEqual(
    row.children[2].textContent,
    completedRouteMidi[index].map(note => completedPractice.key.noteNames[note % 12]).join(" – "),
    "each practice row shows the exact performed notes in low-to-high order"
  );
});
assert.notStrictEqual(progressionUi.elements.voiceProgressionMovementDetails.open, true, "movement analysis begins as secondary collapsed detail");

progressionUi.elements.voiceProgressionPracticeCycleButton.dispatch("click");
assert.strictEqual(progressionUi.api.getVoiceProgressionCompletionMode(), "cycle", "Practice Cycle stays on the completed practice list");
assert.strictEqual(progressionUi.api.getVoiceStage(), "complete", "practice cycles do not open a separate guided exercise");
assert.strictEqual(progressionUi.elements.voiceProgressionSummary.hidden, false, "the list remains visible during a practice cycle");
assert.strictEqual(progressionUi.elements.voiceProgressionSummaryPath.children[0].dataset.state, "active", "the expected chord is highlighted");
playMidiChord(progressionUi, [61, 65, 68]);
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleIndex(), 0, "an incorrect practice chord does not advance");
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleErrorCount(), 1, "practice errors are counted within the cycle");
releaseMidiChord(progressionUi, [61, 65, 68]);
completedRouteMidi.forEach(midi => {
  playMidiChord(progressionUi, midi);
  releaseMidiChord(progressionUi, midi);
});
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleIndex(), 0, "the final chord wraps the practice cycle to chord 1");
assert.strictEqual(progressionUi.api.getCompletedVoiceProgression().practiceCyclesCompleted, 1, "the route counts one completed practice cycle");
assert.strictEqual(progressionUi.api.getVoiceProgressionStats().practiceCyclesCompleted, 1, "practice-cycle statistics update without counting four new progressions");
assert.strictEqual(progressionUi.api.getVoiceProgressionStats().cycleErrors, 1, "practice-cycle errors are retained in statistics");

progressionUi.elements.voiceProgressionNoAssistButton.dispatch("click");
assert.strictEqual(progressionUi.api.getVoiceProgressionCompletionMode(), "unassisted", "Practice Without Help uses the same completed route");
assert.deepStrictEqual(
  progressionUi.api.getCompletedVoiceProgression().route.map(voicing => [...voicing.midi]),
  completedRouteMidi,
  "switching completion modes never regenerates the learned route"
);
assert(
  progressionUi.elements.voiceProgressionSummaryPath.children.every(row => row.children[2].hidden),
  "Practice Without Help hides the note spellings"
);
progressionUi.elements.voiceProgressionShowNotes.checked = true;
progressionUi.elements.voiceProgressionShowNotes.dispatch("change");
assert(
  progressionUi.elements.voiceProgressionSummaryPath.children.every(row => !row.children[2].hidden),
  "Show Notes reveals the same route without regenerating it"
);
completedRouteMidi.forEach(midi => {
  playMidiChord(progressionUi, midi);
  releaseMidiChord(progressionUi, midi);
});
assert.strictEqual(progressionUi.api.getCompletedVoiceProgression().unassistedCyclesCompleted, 1, "an unassisted pass counts as one cycle");
assert.strictEqual(progressionUi.api.getVoiceProgressionStats().unassistedCyclesCompleted, 1, "unassisted cycle statistics update");

progressionUi.elements.midiAnswerMode.value = "exact-voicing";
progressionUi.elements.voiceProgressionPracticeCycleButton.dispatch("click");
const shiftedPracticeStart = completedRouteMidi[0].map(note => note - 12);
playMidiChord(progressionUi, shiftedPracticeStart);
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleIndex(), 1, "Exact Voicing accepts the learned inversion in another octave");
releaseMidiChord(progressionUi, shiftedPracticeStart);
progressionUi.elements.midiAnswerMode.value = "exact-register";
progressionUi.elements.voiceProgressionPracticeCycleButton.dispatch("click");
playMidiChord(progressionUi, shiftedPracticeStart);
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleIndex(), 0, "Exact Register rejects the learned voicing in another octave");
releaseMidiChord(progressionUi, shiftedPracticeStart);
playMidiChord(progressionUi, completedRouteMidi[0]);
assert.strictEqual(progressionUi.api.getVoiceProgressionCycleIndex(), 1, "Exact Register accepts the exact performed MIDI notes");
releaseMidiChord(progressionUi, completedRouteMidi[0]);

progressionUi.elements.midiAnswerMode.value = "exact-voicing";
progressionUi.elements.voiceProgressionReplayButton.dispatch("click");
assert.strictEqual(progressionUi.api.getVoiceStage(), "stage1", "Run Guided Again returns to Stage 1");
assert.deepStrictEqual(
  [...progressionUi.api.getCurrentExercise().startVoicing.midi],
  completedRouteMidi[0],
  "Run Guided Again preserves the performed starting voicing"
);
assert.deepStrictEqual(
  progressionUi.api.getCompletedVoiceProgression().route.map(voicing => [...voicing.midi]),
  completedRouteMidi,
  "returning to guided practice does not regenerate the saved route"
);
playMidiChord(progressionUi, completedRouteMidi[0]);
releaseMidiChord(progressionUi, completedRouteMidi[0]);
assert.deepStrictEqual(
  [...progressionUi.api.getVoiceProgressionPlan().route[1].midi],
  completedRouteMidi[1],
  "Run Guided Again guides the player through the same next voicing"
);
for (let index = 1; index < completedRouteMidi.length; index += 1) {
  playMidiChord(progressionUi, completedRouteMidi[index]);
  releaseMidiChord(progressionUi, completedRouteMidi[index]);
}
assert.strictEqual(progressionUi.api.getVoiceStage(), "complete", "the repeated guided route can be completed normally");
assert.deepStrictEqual(
  progressionUi.api.getCompletedVoiceProgression().route.map(voicing => [...voicing.midi]),
  completedRouteMidi,
  "guided replay completion still yields the identical practice path"
);
assert.strictEqual(
  progressionUi.api.getCompletedVoiceProgression().practiceCyclesCompleted,
  1,
  "guided replay preserves completed practice-cycle state"
);
assert.strictEqual(
  progressionUi.api.getCompletedVoiceProgression().unassistedCyclesCompleted,
  1,
  "guided replay preserves completed unassisted-cycle state"
);
const repeatedExercise = progressionUi.api.getCurrentExercise();
progressionUi.elements.voiceProgressionNewButton.dispatch("click");
assert.strictEqual(progressionUi.api.getCompletedVoiceProgression(), null, "New Progression clears the completed-route practice state");
assert.notStrictEqual(progressionUi.api.getCurrentExercise(), repeatedExercise, "New Progression generates a new exercise object from current settings");
assert.strictEqual(progressionUi.api.getVoiceStage(), "stage1", "the new progression begins at Stage 1");

const hintsStorage = new Map([
  ["voice-leading-settings", JSON.stringify({
    exerciseType: "progression",
    progressionSource: "common",
    commonProgression: "I-vi-IV-V",
    progressionGuidance: "training",
    assistLevel: "hints",
    progressionSequence: ["I", "vi", "IV", "V"]
  })]
]);
const hintsUi = createHarness({ mode: "voice" }, hintsStorage);
hintsUi.elements.startButton.dispatch("click");
hintsUi.elements.revealButton.dispatch("click");
assert.strictEqual(hintsUi.elements.voiceProgressionAssist.hidden, false, "Hints displays quantitative guidance");
assert.strictEqual(hintsUi.elements.voiceAssistPlayBlock.hidden, true, "Hints withholds exact target notes");
assert.strictEqual(hintsUi.elements.voiceTargetChordNotes.hidden, true, "Hints withholds the target chord-note spelling before the answer");
assert(hintsUi.elements.voiceAssistMove.textContent.includes("moving"), "Hints shows the number of moving voices");

const offStorage = new Map([
  ["voice-leading-settings", JSON.stringify({
    exerciseType: "progression",
    progressionSource: "common",
    commonProgression: "I-vi-IV-V",
    progressionGuidance: "solve",
    assistLevel: "full",
    progressionSequence: ["I", "vi", "IV", "V"]
  })]
]);
const offUi = createHarness({ mode: "voice" }, offStorage);
offUi.elements.startButton.dispatch("click");
offUi.elements.revealButton.dispatch("click");
assert.strictEqual(offUi.api.getEffectiveVoiceAssistLevel(), "off", "Solve Each Step is equivalent to assistance Off");
assert.strictEqual(offUi.elements.voiceProgressionAssist.hidden, true, "Off mode preserves the voice-leading challenge");
assert.strictEqual(offUi.elements.voiceTargetChordNotes.hidden, true, "Off mode does not reveal target notes before the answer");

let tiedProgression = null;
for (const startChord of cMajor.chords.filter(item => item.degree !== "vii°")) {
  for (let inversion = 0; inversion < 3 && !tiedProgression; inversion += 1) {
    const startVoicing = midiApi.chooseStartingVoicing(startChord, inversion, cMajor);
    for (const targetChord of cMajor.chords.filter(item => item.degree !== "vii°")) {
      const plan = midiApi.optimizeProgressionRoute(cMajor, [targetChord], startVoicing);
      if (plan.tiedFirstVoicings.length > 1) {
        tiedProgression = midiApi.generateGuidedProgression(
          cMajor,
          [startChord.degree, targetChord.degree],
          () => inversion / 3,
          startVoicing
        );
        break;
      }
    }
  }
}
assert(tiedProgression, "representative diatonic material exposes at least one tied optimal voicing");
const tiedUi = createHarness({ mode: "voice" });
tiedUi.api.renderGuidedProgression(tiedProgression);
tiedUi.elements.voiceScreen.hidden = false;
tiedUi.elements.revealButton.dispatch("click");
const tiedTargets = tiedUi.api.getVoiceProgressionPlan().tiedFirstVoicings;
const tiedAlternative = tiedTargets.find(voicing =>
  voicing.midi.join("-") !== tiedUi.api.getVoiceProgressionPlan().route[1].midi.join("-")
);
playMidiChord(tiedUi, tiedAlternative.midi);
assert.strictEqual(tiedUi.api.getVoiceStage(), "complete", "a tied whole-route optimum is accepted as correct");

const voiceMidi = createHarness({ mode: "voice", difficulty: "guided" });
voiceMidi.elements.startButton.dispatch("click");
const voiceExercise = voiceMidi.api.getCurrentExercise();
playMidiChord(voiceMidi, voiceExercise.bestTarget.midi);
assert.strictEqual(voiceMidi.api.getVoiceStage(), "stage1", "playing the target before the starting voicing does not activate Stage 2");
releaseMidiChord(voiceMidi, voiceExercise.bestTarget.midi);
playMidiChord(voiceMidi, voiceExercise.startVoicing.midi);
assert.strictEqual(voiceMidi.api.getVoiceStage(), "stage2", "correct Stage 1 MIDI validation activates Stage 2");
assert.strictEqual(voiceMidi.elements.voiceStageOneStatus.textContent, "✓ Complete", "correct starting voicing marks Stage 1 complete");
releaseMidiChord(voiceMidi, voiceExercise.startVoicing.midi);
const alternativeVoicing = voiceMidi.api
  .generateTriadVoicings(voiceExercise.targetChord, voiceExercise.key.range)
  .find(voicing => voicing.inversion !== voiceExercise.bestTarget.inversion);
playMidiChord(voiceMidi, alternativeVoicing.midi);
assert.strictEqual(
  voiceMidi.elements.voiceMidiFeedback.textContent,
  "Correct chord, but not the closest voicing",
  "a valid alternative receives the requested not-closest feedback"
);
assert(voiceMidi.elements.voiceMidiDetails.textContent.includes("Detected inversion:"), "alternative feedback identifies the detected inversion");
assert(!voiceMidi.elements.voiceMidiDetails.textContent.includes("Recommended"), "incorrect feedback does not reveal the recommended voicing");
assert.strictEqual(voiceMidi.elements.voiceAnswer.hidden, true, "incorrect Stage 2 voicing allows another attempt without revealing");
releaseMidiChord(voiceMidi, alternativeVoicing.midi);
playMidiChord(voiceMidi, voiceExercise.bestTarget.midi);
assert(voiceMidi.elements.voiceMidiFeedback.textContent.startsWith("✓ Correct"), "recommended voice-leading voicing is accepted");
assert.strictEqual(voiceMidi.elements.voiceAnswer.hidden, false, "correct MIDI voicing reveals the calculated answer");
assert.strictEqual(voiceMidi.elements.voiceAnswerEyebrow.textContent, "Played voicing", "correct MIDI feedback identifies the played voicing");
assert.strictEqual(voiceMidi.api.getVoiceStage(), "complete", "exercise completes only after Stage 2");

const voiceExactRegister = createHarness({ mode: "voice" });
voiceExactRegister.elements.midiAnswerMode.value = "exact-register";
voiceExactRegister.elements.startButton.dispatch("click");
const exactRegisterExercise = voiceExactRegister.api.getCurrentExercise();
const shiftedStartingVoicing = exactRegisterExercise.startVoicing.midi.map(note => note - 12);
playMidiChord(voiceExactRegister, shiftedStartingVoicing);
assert.strictEqual(voiceExactRegister.api.getVoiceStage(), "stage1", "Exact Register rejects the right starting inversion in another octave");
releaseMidiChord(voiceExactRegister, shiftedStartingVoicing);
playMidiChord(voiceExactRegister, exactRegisterExercise.startVoicing.midi);
assert.strictEqual(voiceExactRegister.api.getVoiceStage(), "stage2", "Exact Register accepts the displayed starting register");

const voiceRevealIncorrect = createHarness({ mode: "voice" });
voiceRevealIncorrect.elements.voiceRevealIncorrect.checked = true;
voiceRevealIncorrect.elements.startButton.dispatch("click");
voiceRevealIncorrect.elements.revealButton.dispatch("click");
const revealIncorrectExercise = voiceRevealIncorrect.api.getCurrentExercise();
const revealIncorrectAlternative = voiceRevealIncorrect.api
  .generateTriadVoicings(revealIncorrectExercise.targetChord, revealIncorrectExercise.key.range)
  .find(voicing => voicing.inversion !== revealIncorrectExercise.bestTarget.inversion);
playMidiChord(voiceRevealIncorrect, revealIncorrectAlternative.midi);
assert.strictEqual(
  voiceRevealIncorrect.elements.voiceAnswer.hidden,
  false,
  "Reveal-on-Incorrect optionally shows the closest Stage 2 voicing"
);

const voiceAuto = createHarness({ mode: "voice" });
voiceAuto.elements.midiAutoAdvance.checked = true;
voiceAuto.elements.startButton.dispatch("click");
const voiceAutoExercise = voiceAuto.api.getCurrentExercise();
playMidiChord(voiceAuto, voiceAutoExercise.startVoicing.midi);
const voiceAutoPair = voiceAuto.api.getCurrentExercise().pairKey;
voiceAuto.advance(800);
assert.strictEqual(voiceAuto.api.getCurrentExercise().pairKey, voiceAutoPair, "Auto Advance does not run after Stage 1");
assert.strictEqual(voiceAuto.api.getVoiceStage(), "stage2", "Stage 2 remains active after the Auto Advance delay");
releaseMidiChord(voiceAuto, voiceAutoExercise.startVoicing.midi);
playMidiChord(voiceAuto, voiceAutoExercise.bestTarget.midi);
voiceAuto.advance(799);
assert.strictEqual(voiceAuto.api.getCurrentExercise().pairKey, voiceAutoPair, "completed Stage 2 remains visible during feedback");
voiceAuto.advance(1);
assert.notStrictEqual(voiceAuto.api.getCurrentExercise().pairKey, voiceAutoPair, "Auto Advance starts the next two-stage exercise only after Stage 2");
assert.strictEqual(voiceAuto.api.getVoiceStage(), "stage1", "Auto Advance begins the next exercise at Stage 1");

const aMinorExpected = {
  chordPitchClasses: [9, 0, 4],
  orderedPitchClasses: [0, 4, 9],
  midi: [60, 64, 69]
};
assert.strictEqual(midiApi.compareMidiAnswer([60, 64, 69], aMinorExpected, "exact-register").correct, true, "C4 E4 A4 is the exact preferred A-minor voicing");
assert.strictEqual(midiApi.compareMidiAnswer([57, 60, 64], aMinorExpected, "chord-notes").correct, true, "A3 C4 E4 is the correct target chord");
assert.strictEqual(midiApi.compareMidiAnswer([57, 60, 64], aMinorExpected, "exact-voicing").correct, false, "A3 C4 E4 is a different inversion from the preferred C E A");
assert.strictEqual(midiApi.calculateVoiceMovement([60, 64, 67], [60, 64, 69]).total, 2);
assert.strictEqual(midiApi.calculateVoiceMovement([60, 64, 67], [57, 60, 64]).total, 10);

function specifiedPlayExercise(testKey, degree, inversion) {
  const currentChord = testKey.chords.find(item => item.degree === degree);
  return {
    key: testKey,
    chord: currentChord,
    inversion,
    inversionName: ["root position", "first inversion", "second inversion"][inversion],
    voicing: midiApi.chooseStartingVoicing(currentChord, inversion, testKey)
  };
}

const cRootPrompt = midiApi.expectedPlayAnswer(specifiedPlayExercise(cMajor, "I", 0));
assert.strictEqual(midiApi.compareMidiAnswer([60, 64, 67], cRootPrompt, "exact-voicing").correct, true, "C major root position accepts C E G");
assert.strictEqual(midiApi.compareMidiAnswer([64, 67, 72], cRootPrompt, "exact-voicing").correct, false, "C major root position rejects E G C");
assert.strictEqual(midiApi.compareMidiAnswer([55, 60, 64], cRootPrompt, "exact-voicing").correct, false, "C major root position rejects G C E");

const aMinorFirstPrompt = midiApi.expectedPlayAnswer(specifiedPlayExercise(cMajor, "vi", 1));
assert.strictEqual(midiApi.compareMidiAnswer([60, 64, 69], aMinorFirstPrompt, "exact-voicing").correct, true, "A minor first inversion accepts C E A");
assert.strictEqual(midiApi.compareMidiAnswer([57, 60, 64], aMinorFirstPrompt, "exact-voicing").correct, false, "A minor first inversion rejects A C E");

const fMajorSecondPrompt = midiApi.expectedPlayAnswer(specifiedPlayExercise(cMajor, "IV", 2));
assert.strictEqual(midiApi.compareMidiAnswer([60, 65, 69], fMajorSecondPrompt, "exact-voicing").correct, true, "F major second inversion accepts C F A");
assert.strictEqual(midiApi.compareMidiAnswer([53, 57, 60], fMajorSecondPrompt, "exact-voicing").correct, false, "F major second inversion rejects F A C");
assert.strictEqual(midiApi.compareMidiAnswer([72, 77, 81], fMajorSecondPrompt, "exact-voicing").correct, true, "Play the Chord grading is octave-independent");
assert.strictEqual(midiApi.compareMidiAnswer([72, 77, 81], fMajorSecondPrompt, "exact-register").correct, false, "Exact Register remains available when requested");

function keyboardDiagramFor(testKey, degree, inversion, labelMode = "chord-tones") {
  const exercise = specifiedPlayExercise(testKey, degree, inversion);
  const noteNames = exercise.voicing.midi.map(note => testKey.noteNames[((note % 12) + 12) % 12]);
  return {
    exercise,
    diagram: midiApi.buildKeyboardVoicingDiagramData({
      midiNotes: exercise.voicing.midi,
      noteNames,
      chordToneRoles: midiApi.keyboardChordToneRoles(exercise),
      rootPitchClass: exercise.chord.pitchClasses[0],
      chordName: exercise.chord.name,
      inversion: exercise.inversionName,
      labelMode,
      compact: true
    })
  };
}

const cRootDiagram = keyboardDiagramFor(cMajor, "I", 0);
const cFirstDiagram = keyboardDiagramFor(cMajor, "I", 1);
const cSecondDiagram = keyboardDiagramFor(cMajor, "I", 2);
const aMinorRootDiagram = keyboardDiagramFor(cMajor, "vi", 0);
const fSharpFirstDiagram = keyboardDiagramFor(midiApi.keys["f-sharp-major"], "I", 1);
const eFlatMinorSecondDiagram = keyboardDiagramFor(midiApi.keys["d-flat-major"], "ii", 2);

[
  cRootDiagram,
  cFirstDiagram,
  cSecondDiagram,
  aMinorRootDiagram,
  fSharpFirstDiagram,
  eFlatMinorSecondDiagram
].forEach(({ exercise, diagram }) => {
  assert.deepStrictEqual([...diagram.targetMidi], [...exercise.voicing.midi], "diagram highlights the exact grading voicing");
  assert(diagram.startMidi <= exercise.voicing.midi[0] && diagram.endMidi >= exercise.voicing.midi[2], "keyboard range contains the complete voicing");
  assert(diagram.leftContextWhiteKeys >= 3, "keyboard includes at least three white keys left of the voicing");
  assert(diagram.rightContextWhiteKeys >= 3, "keyboard includes at least three white keys right of the voicing");
  assert.strictEqual(diagram.leftContextWhiteKeys, diagram.rightContextWhiteKeys, "surrounding white-key context keeps the chord centered");
  assert(diagram.keys.filter(keyData => keyData.type === "white").length < 18, "expanded context remains a compact keyboard excerpt");
  assert.strictEqual(diagram.markers.length, 3, "exactly three requested keys are highlighted");
  assert(diagram.markers[0].x < diagram.markers[1].x && diagram.markers[1].x < diagram.markers[2].x, "highlighted keys follow low-to-high order");
  const markerCenter = (diagram.markers[0].x + diagram.markers[2].x) / 2;
  assert(Math.abs(markerCenter - diagram.width / 2) <= diagram.whiteWidth, "highlighted voicing sits near the visual center");
  const visibleBlackPitchClasses = diagram.keys
    .filter(keyData => keyData.type === "black")
    .map(keyData => keyData.pitchClass);
  assert([1, 3].every(pitchClass => visibleBlackPitchClasses.includes(pitchClass)), "visible range includes a recognizable two-black-key group");
  assert([6, 8, 10].every(pitchClass => visibleBlackPitchClasses.includes(pitchClass)), "visible range includes a recognizable three-black-key group");
});

assert.deepStrictEqual([...cRootDiagram.diagram.markers.map(marker => marker.role)], ["R", "3", "5"], "major root-position roles are correct");
assert.deepStrictEqual([...cFirstDiagram.diagram.markers.map(marker => marker.role)], ["3", "5", "R"], "major first-inversion roles are correct");
assert.deepStrictEqual([...cSecondDiagram.diagram.markers.map(marker => marker.role)], ["5", "R", "3"], "major second-inversion roles are correct");
assert.deepStrictEqual([...aMinorRootDiagram.diagram.markers.map(marker => marker.role)], ["R", "♭3", "5"], "minor thirds use the flat-three marker");
assert.deepStrictEqual([...fSharpFirstDiagram.diagram.markers.map(marker => marker.noteName)], ["A#", "C#", "F#"], "F-sharp major first inversion is spelled correctly");
assert.deepStrictEqual([...eFlatMinorSecondDiagram.diagram.markers.map(marker => marker.noteName)], ["Bb", "Eb", "Gb"], "E-flat minor second inversion is spelled correctly");
assert.strictEqual(cFirstDiagram.diagram.markers[2].isRoot, true, "the higher C is the only highlighted root in first inversion");
assert.strictEqual(cFirstDiagram.diagram.targetMidi[2] - cFirstDiagram.diagram.targetMidi[0], 8, "octave-spanning first inversion retains the higher root");

const cKeyboardKeys = cRootDiagram.diagram.keys.sort((first, second) => first.midi - second.midi);
const cWhiteKeys = cKeyboardKeys.filter(keyData => keyData.type === "white");
assert(cWhiteKeys.every(keyData => [0, 2, 4, 5, 7, 9, 11].includes(keyData.pitchClass)), "white-key sequence uses the exact piano pitch classes");
const cBlackKeys = cKeyboardKeys.filter(keyData => keyData.type === "black");
assert(cBlackKeys.every(keyData => [1, 3, 6, 8, 10].includes(keyData.pitchClass)), "black keys occur only at C-sharp, E-flat, F-sharp, A-flat, and B-flat positions");
for (const blackKey of cBlackKeys) {
  const lowerWhite = cWhiteKeys.filter(keyData => keyData.midi < blackKey.midi).at(-1);
  assert.strictEqual(blackKey.x + blackKey.width / 2, lowerWhite.x + lowerWhite.width, "each black key is centered between the correct white keys");
}

midiApi.resetPlayPromptHistory();
const generatedPrompts = [];
for (let index = 0; index < 18; index += 1) {
  midiApi.resetPlayPromptHistory();
  generatedPrompts.push(midiApi.generatePlayExercise(cMajor, () => (index + 0.1) / 18));
}
assert.deepStrictEqual(
  [...new Set(generatedPrompts.map(exercise => exercise.inversion))],
  [0, 1, 2],
  "random Play the Chord generation covers every inversion"
);
assert.deepStrictEqual(
  [...new Set(generatedPrompts.map(exercise => exercise.chord.degree))],
  ["I", "ii", "iii", "IV", "V", "vi"],
  "random Play the Chord generation uses all six supported diatonic chords"
);
assert(generatedPrompts.every(exercise => ["major", "minor"].includes(exercise.chord.quality)), "diminished and augmented chords are excluded");
midiApi.resetPlayPromptHistory();
const firstGeneratedPrompt = midiApi.generatePlayExercise(cMajor, () => 0);
const secondGeneratedPrompt = midiApi.generatePlayExercise(cMajor, () => 0);
assert.notStrictEqual(firstGeneratedPrompt.promptKey, secondGeneratedPrompt.promptKey, "the same Play the Chord prompt does not repeat immediately");

const statsStart = {
  completed: 0,
  firstAttempts: 0,
  totalResponseMs: 0,
  currentStreak: 0,
  longestStreak: 0
};
const statsFirstCorrect = midiApi.updatePlayStatistics(statsStart, {
  correct: true,
  firstAttempt: true,
  responseMs: 900
});
assert.deepStrictEqual(
  { ...statsFirstCorrect },
  { completed: 1, firstAttempts: 1, totalResponseMs: 900, currentStreak: 1, longestStreak: 1 },
  "statistics count a correct first attempt and its response time"
);
const statsWrong = midiApi.updatePlayStatistics(statsFirstCorrect, {
  correct: false,
  firstAttempt: true,
  responseMs: 400
});
assert.strictEqual(statsWrong.currentStreak, 0, "an incorrect first attempt resets the current streak");
const statsRetryCorrect = midiApi.updatePlayStatistics(statsWrong, {
  correct: true,
  firstAttempt: false,
  responseMs: 1500
});
assert.strictEqual(statsRetryCorrect.completed, 2, "a correct retry still completes the exercise");
assert.strictEqual(statsRetryCorrect.firstAttempts, 1, "a correct retry does not count as a first-attempt success");
assert.strictEqual(statsRetryCorrect.longestStreak, 1, "longest streak remains intact after a retry");

const playGuided = createHarness({ mode: "play", playDifficulty: "guided" });
playGuided.elements.startButton.dispatch("click");
assert.strictEqual(playGuided.elements.playScreen.hidden, false, "Chord Practice starts from the Keyboard mode option");
assert.strictEqual(playGuided.elements.playRoman.hidden, true, "chromatic-root practice does not invent Roman numerals");
assert.strictEqual(playGuided.elements.playChordName.hidden, false, "Guided shows the chord name and quality");
assert.strictEqual(playGuided.elements.playAnswer.hidden, false, "Guided shows target notes and the keyboard shape before the answer");
assert.strictEqual(playGuided.elements.playKeyboardDiagram.children.length, 1, "Guided renders one compact keyboard diagram");
const playGuidedExercise = playGuided.api.getCurrentPlayExercise();
assert.strictEqual(playGuidedExercise.exerciseId, "keyboard.chord_practice", "prompt uses the consolidated stable exercise ID");
assert(["major", "minor"].includes(playGuidedExercise.chord.formulaId), "default prompt pool contains major and minor chords");
const guidedSvg = playGuided.elements.playKeyboardDiagram.children[0];
assert(guidedSvg.attributes["aria-label"].includes(playGuidedExercise.chord.name), "keyboard SVG has an accessible chord description");
const guidedMarkers = guidedSvg.children.filter(child => child.tagName === "G");
assert.deepStrictEqual(
  [...guidedMarkers.map(group => group.attributes["data-role"])],
  [...playGuided.api.keyboardChordToneRoles(playGuidedExercise)],
  "rendered marker roles match the generated inversion"
);
assert(guidedMarkers.every(group => group.children.length === 2), "Chord tones mode places one role label in each marker");
playGuided.elements.playKeyboardDiagramLabels.value = "both";
playGuided.elements.playKeyboardDiagramLabels.dispatch("change");
assert(
  playGuided.elements.playKeyboardDiagram.children[0].children
    .filter(child => child.tagName === "G")
    .every(group => group.children.length === 3),
  "Both mode renders chord-tone and note-name labels"
);
playGuided.elements.playKeyboardDiagramLabels.value = "none";
playGuided.elements.playKeyboardDiagramLabels.dispatch("change");
assert(
  playGuided.elements.playKeyboardDiagram.children[0].children
    .filter(child => child.tagName === "G")
    .every(group => group.children.length === 1),
  "None mode retains accessible markers without visible text labels"
);
playGuided.elements.playKeyboardDiagramLabels.value = "chord-tones";
playGuided.elements.playKeyboardDiagramLabels.dispatch("change");
assert(/\.keyboard-voicing-diagram[\s\S]*width: min\(520px, 100%\)/.test(html), "keyboard diagram stays compact and fluid on wide screens");
assert(/@media \(max-width: 600px\)[\s\S]*\.keyboard-voicing-diagram/.test(html), "keyboard diagram has a narrow-screen size rule");
assert.strictEqual(guidedSvg.attributes.preserveAspectRatio, "xMidYMid meet", "SVG scaling preserves piano-key proportions");
playGuided.keyDown("r");
assert.strictEqual(playGuided.elements.playAnswer.hidden, false, "R reveals the Play the Chord notes");
const beforeManualNext = playGuided.api.getCurrentPlayExercise().promptKey;
playGuided.keyDown(" ");
assert.notStrictEqual(playGuided.api.getCurrentPlayExercise().promptKey, beforeManualNext, "Space manually advances to a new prompt");
const beforeResetTime = playGuided.api.getPlayExerciseStartedAt();
playGuided.advance(500);
playGuided.keyDown("Escape");
assert(playGuided.api.getPlayExerciseStartedAt() > beforeResetTime, "Escape resets the current attempt timer");
assert.strictEqual(playGuided.elements.playAnswer.hidden, false, "Escape restores the Guided visual answer");

const playStandard = createHarness({ mode: "play", playDifficulty: "standard" });
playStandard.elements.startButton.dispatch("click");
assert.strictEqual(playStandard.elements.playRoman.hidden, true, "Standard hides Roman numerals by default");
assert.strictEqual(playStandard.elements.playChordName.hidden, false, "Standard displays the chord name");
assert.strictEqual(playStandard.elements.playAnswer.hidden, true, "Standard hides notes and the diagram before the answer");
const standardPromptKey = playStandard.api.getCurrentPlayExercise().promptKey;
playStandard.elements.playRevealButton.dispatch("click");
assert.strictEqual(playStandard.elements.playAnswer.hidden, false, "Reveal shows the Standard answer");
assert.strictEqual(playStandard.elements.playKeyboardDiagram.children.length, 1, "Reveal renders the Standard keyboard diagram");
assert.strictEqual(playStandard.api.getCurrentPlayExercise().promptKey, standardPromptKey, "Reveal preserves the current exercise");

const playChallenge = createHarness({ mode: "play", playDifficulty: "challenge" });
playChallenge.elements.startButton.dispatch("click");
assert.strictEqual(playChallenge.elements.playRoman.hidden, true, "Challenge does not invent a Roman numeral for chromatic-root practice");
assert.strictEqual(playChallenge.elements.playChordName.hidden, false, "performance prompts always retain the chord name needed to play");
assert.strictEqual(playChallenge.elements.playAnswer.hidden, true, "Challenge hides target notes and the diagram before the answer");

const playWrong = createHarness({ mode: "play", playDifficulty: "standard" });
playWrong.elements.startButton.dispatch("click");
const wrongExercise = playWrong.api.getCurrentPlayExercise();
const wrongInversion = playWrong.api
  .generateTriadVoicings(wrongExercise.chord, wrongExercise.key.range)
  .find(voicing => voicing.inversion !== wrongExercise.inversion);
playMidiChord(playWrong, wrongInversion.midi);
assert.strictEqual(playWrong.elements.playMidiFeedback.textContent, "Correct chord — wrong inversion", "wrong inversion receives specific feedback");
assert(playWrong.elements.playMidiDetails.textContent.includes("Expected:"), "wrong-inversion feedback names the expected inversion");
assert.strictEqual(playWrong.elements.playAnswer.hidden, true, "wrong inversion does not reveal notes by default");
releaseMidiChord(playWrong, wrongInversion.midi);
const wrongChord = wrongExercise.key.chords.find(item =>
  [...item.pitchClasses].sort((a, b) => a - b).join(",") !==
  [...wrongExercise.chord.pitchClasses].sort((a, b) => a - b).join(",")
);
const wrongChordVoicing = playWrong.api.chooseStartingVoicing(wrongChord, 0, wrongExercise.key);
playMidiChord(playWrong, wrongChordVoicing.midi);
assert.strictEqual(playWrong.elements.playMidiFeedback.textContent, "Incorrect chord", "a different chord receives incorrect-chord feedback");
assert(playWrong.elements.playMidiDetails.textContent.startsWith("Detected:"), "incorrect-chord feedback identifies the detected chord");
releaseMidiChord(playWrong, wrongChordVoicing.midi);
const correctAfterRetry = closedVoicingForPitchClasses(playWrong.api.expectedPlayAnswer(wrongExercise).orderedPitchClasses, 36);
playMidiChord(playWrong, correctAfterRetry);
assert.strictEqual(playWrong.elements.playMidiFeedback.textContent, "✓ Correct", "the user can retry until correct");
assert.strictEqual(playWrong.api.getPlayStats().completed, 1, "correct retry completes one exercise");
assert.strictEqual(playWrong.api.getPlayStats().firstAttempts, 0, "correct retry is not counted as a first-attempt success");
assert(playWrong.elements.playResponse.textContent.includes("Response time:"), "optional response time appears after a correct answer");
assert.strictEqual(playWrong.elements.playAnswer.hidden, false, "Standard shows the answer after a correct response");
assert(playWrong.elements.playAnswerConfirmation.textContent.includes(playWrong.api.getCurrentPlayExercise().inversionName), "correct-answer feedback confirms the inversion");

const playRevealWrong = createHarness({ mode: "play", playDifficulty: "standard" });
playRevealWrong.elements.playRevealIncorrect.checked = true;
playRevealWrong.elements.startButton.dispatch("click");
const revealWrongExercise = playRevealWrong.api.getCurrentPlayExercise();
const revealWrongVoicing = playRevealWrong.api
  .generateTriadVoicings(revealWrongExercise.chord, revealWrongExercise.key.range)
  .find(voicing => voicing.inversion !== revealWrongExercise.inversion);
playMidiChord(playRevealWrong, revealWrongVoicing.midi);
assert.strictEqual(playRevealWrong.elements.playAnswer.hidden, false, "Reveal on Incorrect shows the requested notes");
assert.strictEqual(playRevealWrong.elements.playKeyboardDiagram.children.length, 1, "Reveal on Incorrect also shows the requested keyboard shape");

const playManual = createHarness({ mode: "play" });
playManual.elements.startButton.dispatch("click");
const manualExercise = playManual.api.getCurrentPlayExercise();
const manualAnswer = closedVoicingForPitchClasses(playManual.api.expectedPlayAnswer(manualExercise).orderedPitchClasses, 36);
playMidiChord(playManual, manualAnswer);
const manualPromptKey = playManual.api.getCurrentPlayExercise().promptKey;
playManual.advance(700);
assert.strictEqual(playManual.api.getCurrentPlayExercise().promptKey, manualPromptKey, "correct answers stay put when Auto Advance is off");

const playRegister = createHarness({ mode: "play" });
playRegister.elements.playExactRegister.checked = true;
playRegister.elements.startButton.dispatch("click");
const registerExercise = playRegister.api.getCurrentPlayExercise();
const anotherRegister = registerExercise.voicing.midi.map(note => note - 12);
playMidiChord(playRegister, anotherRegister);
assert.strictEqual(
  playRegister.elements.playMidiFeedback.textContent,
  "Correct chord and inversion — wrong register",
  "Exact Register distinguishes a register error from an inversion error"
);
releaseMidiChord(playRegister, anotherRegister);
playMidiChord(playRegister, registerExercise.voicing.midi);
assert.strictEqual(playRegister.elements.playMidiFeedback.textContent, "✓ Correct", "Exact Register accepts the generated MIDI register");
assert(/\d/.test(playRegister.elements.playAnswerNotes.textContent), "Exact Register adds octave labels to the target-note list");
const registerSvg = playRegister.elements.playKeyboardDiagram.children[0];
assert.deepStrictEqual(
  registerSvg.children.filter(child => child.tagName === "G").map(group => Number(group.attributes["data-midi"])),
  [...registerExercise.voicing.midi],
  "Exact Register diagram highlights the exact expected MIDI notes"
);

const playChallengeCorrect = createHarness({ mode: "play", playDifficulty: "challenge" });
playChallengeCorrect.elements.startButton.dispatch("click");
const challengeExercise = playChallengeCorrect.api.getCurrentPlayExercise();
const challengeAnswer = closedVoicingForPitchClasses(playChallengeCorrect.api.expectedPlayAnswer(challengeExercise).orderedPitchClasses, 36);
playMidiChord(playChallengeCorrect, challengeAnswer);
assert.strictEqual(playChallengeCorrect.elements.playMidiFeedback.textContent, "✓ Correct", "Challenge accepts the correct unseen voicing");
assert.strictEqual(playChallengeCorrect.elements.playAnswer.hidden, true, "Challenge keeps the keyboard diagram hidden after a correct answer");
playChallengeCorrect.elements.playRevealButton.dispatch("click");
assert.strictEqual(playChallengeCorrect.elements.playAnswer.hidden, false, "Challenge shows the diagram only after Reveal");

const playAuto = createHarness({ mode: "play", playDifficulty: "standard" });
playAuto.elements.midiAutoAdvance.checked = true;
playAuto.elements.startButton.dispatch("click");
const autoPlayExercise = playAuto.api.getCurrentPlayExercise();
const autoPlayAnswer = closedVoicingForPitchClasses(playAuto.api.expectedPlayAnswer(autoPlayExercise).orderedPitchClasses, 36);
playMidiChord(playAuto, autoPlayAnswer);
const autoPlayPromptKey = playAuto.api.getCurrentPlayExercise().promptKey;
assert.strictEqual(playAuto.elements.playAnswer.hidden, false, "Standard correct-answer diagram appears before Auto Advance");
playAuto.advance(599);
assert.strictEqual(playAuto.api.getCurrentPlayExercise().promptKey, autoPlayPromptKey, "Play the Chord remains visible during the brief correct feedback");
playAuto.advance(1);
assert.notStrictEqual(playAuto.api.getCurrentPlayExercise().promptKey, autoPlayPromptKey, "Auto Advance generates the next prompt after 600ms");

const playKeyStorage = new Map();
const playKeyChange = createHarness({ mode: "play" }, playKeyStorage);
playKeyChange.elements.playKeySelect.value = "a-flat-major";
playKeyChange.elements.playKeySelect.dispatch("change");
playKeyChange.elements.startButton.dispatch("click");
assert.strictEqual(playKeyChange.api.getCurrentPlayExercise().key.id, "a-flat-major", "Play the Chord uses the selected key");
assert.strictEqual(playKeyStorage.get("voice-leading-selected-key"), "a-flat-major", "the shared key selection is preserved");
assert.strictEqual(playKeyStorage.get("music-trainer-selected-mode"), "play", "the selected trainer mode is preserved");
const restoredPlayMode = createHarness({}, playKeyStorage);
assert.strictEqual(restoredPlayMode.api.getSelectedKeyId(), "a-flat-major", "the selected key restores on the next open");
assert.strictEqual(restoredPlayMode.api.getSelectedMode(), "play", "the selected trainer mode restores on the next open");

const playDiagramSettingsStorage = new Map();
const playDiagramSettings = createHarness({ mode: "play" }, playDiagramSettingsStorage);
playDiagramSettings.elements.playKeyboardDiagramLabels.value = "both";
playDiagramSettings.elements.playKeyboardDiagramLabels.dispatch("change");
assert.strictEqual(
  JSON.parse(playDiagramSettingsStorage.get("play-the-chord-settings")).keyboardDiagramLabels,
  "both",
  "Keyboard Diagram Labels is saved with the existing Play the Chord settings"
);
const restoredPlayDiagramSettings = createHarness({ mode: "play" }, playDiagramSettingsStorage);
assert.strictEqual(restoredPlayDiagramSettings.elements.playKeyboardDiagramLabels.value, "both", "diagram label preference restores on the next session");

const chordPracticeBaseSettings = {
  direction: "chord-to-play",
  rootMode: "all",
  selectedRoots: [...Array(12).keys()],
  chordTypeIds: ["major", "minor"],
  inversions: [0, 1, 2],
  anyInversion: false
};
assert.deepStrictEqual(
  [...midiApi.createPracticeChord(6, "minor", "F#").noteNames],
  ["F#", "A", "C#"],
  "chromatic-root practice preserves sensible theoretical spelling"
);

const supportedChordExpectations = {
  major: { notes: ["C", "E", "G"], symbol: "C", inversions: 3 },
  minor: { notes: ["C", "Eb", "G"], symbol: "Cm", inversions: 3 },
  diminished: { notes: ["C", "Eb", "Gb"], symbol: "Cdim", inversions: 3 },
  augmented: { notes: ["C", "E", "G#"], symbol: "Caug", inversions: 3 },
  sus2: { notes: ["C", "D", "G"], symbol: "Csus2", inversions: 3 },
  sus4: { notes: ["C", "F", "G"], symbol: "Csus4", inversions: 3 },
  "major-seven": { notes: ["C", "E", "G", "B"], symbol: "Cmaj7", inversions: 4 },
  "dominant-seven": { notes: ["C", "E", "G", "Bb"], symbol: "C7", inversions: 4 },
  "minor-seven": { notes: ["C", "Eb", "G", "Bb"], symbol: "Cm7", inversions: 4 },
  "minor-major-seven": { notes: ["C", "Eb", "G", "B"], symbol: "CmMaj7", inversions: 4 },
  "half-diminished-seven": { notes: ["C", "Eb", "Gb", "Bb"], symbol: "Cm7b5", inversions: 4 },
  "diminished-seven": { notes: ["C", "Eb", "Gb", "Bbb"], symbol: "Cdim7", inversions: 4 },
  add9: { notes: ["C", "D", "E", "G"], symbol: "Cadd9", inversions: 4 },
  "minor-add9": { notes: ["C", "D", "Eb", "G"], symbol: "Cmadd9", inversions: 4 },
  six: { notes: ["C", "E", "G", "A"], symbol: "C6", inversions: 4 },
  "minor-six": { notes: ["C", "Eb", "G", "A"], symbol: "Cm6", inversions: 4 }
};
assert.strictEqual(midiApi.chordDefinitions.length, 16, "one shared catalog exposes all supported Chord Practice types");
for (const [formulaId, expectation] of Object.entries(supportedChordExpectations)) {
  const definition = midiApi.chordDefinitions.find(item => item.id === formulaId);
  const testChord = midiApi.createPracticeChord(0, formulaId, "C");
  assert(definition && definition.noteCount === expectation.inversions, `${formulaId} has structured note-count metadata`);
  assert.deepStrictEqual([...definition.supportedInversions], [...Array(expectation.inversions).keys()], `${formulaId} exposes only valid inversions`);
  assert.deepStrictEqual([...testChord.noteNames], expectation.notes, `${formulaId} uses correct theoretical spelling`);
  assert.strictEqual(testChord.symbol, expectation.symbol, `${formulaId} uses the consistent chord symbol`);
  for (let inversion = 0; inversion < expectation.inversions; inversion += 1) {
    const voicing = midiApi.choosePracticeVoicing(testChord, inversion, cMajor);
    assert(voicing && voicing.midi.length === expectation.inversions, `${formulaId} inversion ${inversion} renders the correct number of piano notes`);
    const orderedPitchClasses = testChord.pitchClasses.slice(inversion).concat(testChord.pitchClasses.slice(0, inversion));
    assert.deepStrictEqual(voicing.midi.map(note => ((note % 12) + 12) % 12), orderedPitchClasses, `${formulaId} inversion ${inversion} shares exact note order with MIDI grading`);
  }
}

const majorOnlyPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  chordTypeIds: ["major"]
}, cMajor);
assert(majorOnlyPool.length > 0 && majorOnlyPool.every(item => item.chord.formulaId === "major"), "major-only filtering produces only major chords");
assert.strictEqual(new Set(majorOnlyPool.map(item => item.chord.rootPitchClass)).size, 12, "All 12 includes every chromatic root");
const minorOnlyPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  chordTypeIds: ["minor"]
}, cMajor);
assert(minorOnlyPool.length > 0 && minorOnlyPool.every(item => item.chord.formulaId === "minor"), "minor-only filtering produces only minor chords");
const multipleTypePool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  chordTypeIds: ["major", "sus4", "dominant-seven"],
  inversions: [0]
}, cMajor);
assert.deepStrictEqual(
  [...new Set(multipleTypePool.map(item => item.chord.formulaId))].sort(),
  ["dominant-seven", "major", "sus4"],
  "multiple chord types share one configurable exercise pool"
);

const selectedRootPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  rootMode: "selected",
  selectedRoots: [0, 5, 7],
  chordTypeIds: ["major"],
  inversions: [0]
}, cMajor);
assert.deepStrictEqual(
  [...new Set(selectedRootPool.map(item => item.chord.rootPitchClass))],
  [0, 5, 7],
  "Selected roots limits practice to the chosen chromatic roots"
);

const diatonicPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  rootMode: "diatonic",
  chordTypeIds: ["major", "minor", "diminished", "dominant-seven", "major-seven", "minor-seven", "half-diminished-seven"],
  inversions: [0]
}, cMajor);
assert(diatonicPool.some(item => item.chord.romanNumeral === "vii°" && item.chord.formulaId === "diminished"), "diatonic filtering includes the leading-tone diminished triad when enabled");
assert(diatonicPool.some(item => item.chord.romanNumeral === "V7" && item.chord.name === "G dominant 7"), "diatonic filtering creates the correctly named dominant seventh");
assert.deepStrictEqual(
  [...diatonicPool.find(item => item.chord.romanNumeral === "ii7").chord.noteNames],
  ["D", "F", "A", "C"],
  "diatonic seventh chords preserve theoretical spelling"
);

const triadInversionPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  chordTypeIds: ["major"],
  inversions: [0, 1, 2, 3]
}, cMajor);
assert.deepStrictEqual([...new Set(triadInversionPool.map(item => item.inversion))], [0, 1, 2], "triads support root, first, and second inversion only");
const seventhInversionPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  chordTypeIds: ["dominant-seven"],
  inversions: [0, 1, 2, 3]
}, cMajor);
assert.deepStrictEqual([...new Set(seventhInversionPool.map(item => item.inversion))], [0, 1, 2, 3], "seventh chords support all four inversions");

const exactCFirst = midiApi.createChordPracticeItem(0, "major", 1);
const exactFSecond = midiApi.createChordPracticeItem(5, "major", 2);
const exactAMinorRoot = midiApi.createChordPracticeItem(9, "minor", 0);
assert(exactCFirst.id && exactCFirst.chordSymbol === "C", "custom items use stable structured chord-and-inversion data");
assert.strictEqual(midiApi.createChordPracticeItem(0, "major", 3), null, "triads reject an unsupported third inversion");
assert.strictEqual(midiApi.createChordPracticeItem(0, "major-seven", 3).inversion, 3, "seventh chords accept third inversion");
const oneExactPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  poolMode: "custom",
  customItems: [exactCFirst]
}, cMajor);
assert.strictEqual(oneExactPool.length, 1, "one exact chord and inversion creates one practice item");
assert.strictEqual(oneExactPool[0].chord.rootPitchClass, 0, "the exact custom root is preserved");
assert.strictEqual(oneExactPool[0].inversion, 1, "the exact custom inversion is preserved");
const mixedExactPool = midiApi.buildChordPracticePool({
  ...chordPracticeBaseSettings,
  poolMode: "custom",
  customItems: [exactCFirst, exactFSecond, exactAMinorRoot]
}, cMajor);
assert.deepStrictEqual(
  mixedExactPool.map(item => [item.chord.rootPitchClass, item.chord.formulaId, item.inversion]),
  [[0, "major", 1], [5, "major", 2], [9, "minor", 0]],
  "different exact chords and inversions coexist without broad-filter additions"
);

const listedState = { index: 0 };
const listedSettings = {
  ...chordPracticeBaseSettings,
  poolMode: "custom",
  customItems: [exactCFirst, exactFSecond, exactAMinorRoot],
  order: "listed",
  repeatList: false
};
assert.strictEqual(midiApi.generateChordPracticeExercise(listedSettings, cMajor, () => 0, listedState).customItemId, exactCFirst.id, "Listed order begins with the first item");
assert.strictEqual(midiApi.generateChordPracticeExercise(listedSettings, cMajor, () => 0, listedState).customItemId, exactFSecond.id, "Listed order follows the editable item order");
assert.strictEqual(midiApi.generateChordPracticeExercise(listedSettings, cMajor, () => 0, listedState).customItemId, exactAMinorRoot.id, "Listed order reaches the final item exactly once");
assert.strictEqual(midiApi.generateChordPracticeExercise(listedSettings, cMajor, () => 0, listedState), null, "Repeat off ends after the final listed item");
listedSettings.repeatList = true;
assert.strictEqual(midiApi.generateChordPracticeExercise(listedSettings, cMajor, () => 0, listedState).customItemId, exactCFirst.id, "Repeat on restarts the listed set");
midiApi.resetPlayPromptHistory();
const randomSettings = { ...listedSettings, order: "random", customItems: [exactCFirst, exactFSecond] };
const randomFirst = midiApi.generateChordPracticeExercise(randomSettings, cMajor, () => 0);
const randomSecond = midiApi.generateChordPracticeExercise(randomSettings, cMajor, () => 0);
assert.notStrictEqual(randomFirst.promptKey, randomSecond.promptKey, "Random custom practice avoids an immediate repeat when possible");

const progressionBuilderUi = createHarness({ mode: "play" });
const elementDescendants = element => element.children.flatMap(child =>
  [child, ...elementDescendants(child)]
);
const progressionInversionControls = harness =>
  elementDescendants(harness.elements.playProgressionSequence)
    .filter(element => element.tagName === "SELECT" &&
      /inversion/i.test(element.attributes["aria-label"] || ""));
progressionBuilderUi.elements.playPracticeType.value = "progression";
progressionBuilderUi.elements.playPracticeType.dispatch("change");
assert.strictEqual(progressionBuilderUi.elements.playIndividualSettings.hidden, true, "Progression hides Individual Chords setup");
assert.strictEqual(progressionBuilderUi.elements.playProgressionSettings.hidden, false, "Progression reveals its focused setup");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionItems().length, 4, "the default common progression creates four ordered steps");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute().length, 4, "a valid common progression previews automatically without a Build action");
assert.strictEqual(progressionBuilderUi.elements.playCommonProgressionControls.hidden, false, "common progression settings remain visible");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditor.hidden, true, "the custom editor is not shown for a common progression");
assert.strictEqual(progressionBuilderUi.elements.playProgressionSequence.children.length, 0, "common progressions do not render a redundant read-only chord list");
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreview.hidden, false, "the generated keyboard-diagram preview becomes the primary result");
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreviewList.hidden, false, "the active preview shows its keyboard-diagram cards");
assert.strictEqual(progressionBuilderUi.elements.playProgressionStartButton.hidden, false, "Start Progression appears with a valid preview");
assert.strictEqual(progressionBuilderUi.elements.startButton.hidden, true, "the distant generic Start button is hidden for Progression practice");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditButton.textContent, "Customize This Progression", "preset mode offers an explicit customization action");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditButton.attributes["aria-label"], "Customize this progression", "the customization action has a clear accessible name");
progressionBuilderUi.elements.playCommonStartingInversion.value = "2";
progressionBuilderUi.elements.playCommonStartingInversion.dispatch("change");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute()[0].inversion, 2, "the common starting-inversion setting immediately recalculates the preview");
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreviewList.children[0].children[1].textContent, "second inversion", "the visible common preview announces the recalculated starting inversion");
progressionBuilderUi.elements.playCommonProgressionSelect.value = "ii-V-I";
progressionBuilderUi.elements.playCommonProgressionSelect.dispatch("change");
assert.deepStrictEqual(
  [...progressionBuilderUi.api.getChordPracticeProgressionItems().map(item => item.romanNumeral)],
  ["ii", "V", "I"],
  "common progression selection follows the chosen key and Roman-numeral order"
);
assert.deepStrictEqual(
  [...progressionBuilderUi.api.getChordPracticeProgressionRoute().map(exercise => exercise.chord.romanNumeral)],
  ["ii", "V", "I"],
  "changing a common progression immediately replaces the preview route"
);
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute()[0].inversion, 2, "changing the preset preserves the common starting inversion");
const commonItemsBeforeEditing = progressionBuilderUi.api.getChordPracticeProgressionItems();
const commonMusicalDataBeforeEditing = commonItemsBeforeEditing.map(item => [
  item.rootPitchClass,
  item.formulaId,
  item.inversion,
  item.romanNumeral
]);
const commonRouteBeforeEditing = progressionBuilderUi.api.getChordPracticeProgressionRoute()
  .map(exercise => [...exercise.voicing.midi]);
const presetDefinitionsBeforeEditing = JSON.stringify(progressionBuilderUi.api.chordPracticeCommonProgressions);
progressionBuilderUi.elements.playProgressionEditButton.dispatch("click");
assert.strictEqual(progressionBuilderUi.elements.playProgressionSource.value, "custom", "Customize This Progression converts the preset into Build Your Own");
assert.strictEqual(progressionBuilderUi.elements.playCommonProgressionControls.hidden, true, "preset-only controls are hidden after conversion");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditor.hidden, false, "conversion opens the real editable builder");
assert.strictEqual(progressionBuilderUi.elements.playCustomProgressionBuilder.hidden, false, "conversion exposes the compact Add a Chord controls");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditButton.textContent, "Edit Progression", "custom mode labels the focus action as editing");
assert.deepStrictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionItems().map(item => [
    item.rootPitchClass,
    item.formulaId,
    item.inversion,
    item.romanNumeral
  ]),
  commonMusicalDataBeforeEditing,
  "customization preserves preset chord roots, types, order, and starting inversion"
);
assert.notDeepStrictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionItems().map(item => item.id),
  commonItemsBeforeEditing.map(item => item.id),
  "customization creates an independent editable copy"
);
assert.deepStrictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionRoute().map(exercise => [...exercise.voicing.midi]),
  commonRouteBeforeEditing,
  "conversion keeps the live preview on the same exact voicings"
);
assert.strictEqual(JSON.stringify(progressionBuilderUi.api.chordPracticeCommonProgressions), presetDefinitionsBeforeEditing, "customization never mutates the common-progression presets");
assert.strictEqual(progressionBuilderUi.elements.playProgressionSequence.children.length, 3, "editable rows appear only after customization");
assert.strictEqual(progressionBuilderUi.getActiveElement(), progressionBuilderUi.elements.playProgressionAddHeading, "customization moves focus to the editor heading");
let firstEditableRoot = elementDescendants(progressionBuilderUi.elements.playProgressionSequence)
  .find(element => element.tagName === "SELECT" && /Root for progression chord 1/.test(element.attributes["aria-label"] || ""));
assert(firstEditableRoot, "the opened editor provides a root selector for chord 1");
firstEditableRoot.value = "4";
firstEditableRoot.dispatch("change");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionItems()[0].rootPitchClass, 4, "a chord root can be changed through the compact editor");
let firstEditableType = elementDescendants(progressionBuilderUi.elements.playProgressionSequence)
  .find(element => element.tagName === "SELECT" && /Chord type for progression chord 1/.test(element.attributes["aria-label"] || ""));
assert(firstEditableType, "the opened editor provides a chord-type selector for chord 1");
firstEditableType.value = "major-seven";
firstEditableType.dispatch("change");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionItems()[0].formulaId, "major-seven", "a chord type can be changed through the compact editor");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute()[0].chord.symbol, "Emaj7", "the live preview uses the latest edited root and chord type");
assert.strictEqual(
  progressionBuilderUi.elements.playProgressionPreviewList.children[0].children[2].textContent,
  progressionBuilderUi.api.getChordPracticeProgressionRoute()[0].orderedNoteNames.join(" – "),
  "the visible preview notes match the latest edited progression"
);
progressionBuilderUi.api.clearChordPracticeProgression();
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreview.hidden, true, "an incomplete progression has no stale preview");
assert.strictEqual(progressionBuilderUi.elements.playProgressionStartButton.hidden, true, "Start Progression is unavailable for an incomplete progression");
assert.strictEqual(progressionBuilderUi.elements.playProgressionHint.textContent, "Add at least two chords to practice a progression.", "the incomplete state explains the exact requirement");
progressionBuilderUi.elements.playProgressionStartButton.dispatch("click");
assert.strictEqual(progressionBuilderUi.api.getCurrentPlayExercise(), null, "an invalid progression cannot start even if its hidden action is invoked programmatically");
const progressionC = progressionBuilderUi.api.addChordPracticeProgressionItem(
  midiApi.createChordPracticeItem(0, "major", 0)
);
const progressionA = progressionBuilderUi.api.addChordPracticeProgressionItem(
  midiApi.createChordPracticeItem(9, "minor", 1)
);
const progressionF = progressionBuilderUi.api.addChordPracticeProgressionItem(
  midiApi.createChordPracticeItem(5, "major", 2)
);
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionItems().length, 3, "custom progression adds exact chord steps");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute().length, 3, "Choose Inversions previews automatically as soon as every step is valid");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditor.hidden, false, "the editor stays open during an explicit editing pass");
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreviewList.hidden, false, "the live keyboard preview remains visible while editing");
assert.strictEqual(progressionBuilderUi.elements.playProgressionStartButton.hidden, false, "Start Progression remains available while the valid editor is open");
const duplicatedProgressionStep = progressionBuilderUi.api.duplicateChordPracticeProgressionItem(progressionA.id);
assert(duplicatedProgressionStep && progressionBuilderUi.api.getChordPracticeProgressionItems().length === 4, "a progression step can be duplicated");
assert.strictEqual(progressionBuilderUi.api.moveChordPracticeProgressionItem(progressionF.id, -1), true, "a progression step can move earlier");
assert.deepStrictEqual(
  [...progressionBuilderUi.api.getChordPracticeProgressionRoute().map(exercise => exercise.progressionItemId)],
  [...progressionBuilderUi.api.getChordPracticeProgressionItems().map(item => item.id)],
  "changing chord order immediately regenerates the preview in the same order"
);
assert.strictEqual(progressionBuilderUi.api.removeChordPracticeProgressionItem(duplicatedProgressionStep.id), true, "a progression step can be removed");
const routeBeforeChordEdit = progressionBuilderUi.api.getChordPracticeProgressionRoute()
  .map(exercise => exercise.promptKey).join("|");
const updatedProgressionStep = progressionBuilderUi.api.updateChordPracticeProgressionItem(
  progressionA.id,
  { formulaId: "minor-seven" }
);
assert.strictEqual(updatedProgressionStep.formulaId, "minor-seven", "a progression step chord type can be edited");
assert.strictEqual(updatedProgressionStep.inversion, 1, "editing a progression chord preserves a still-valid inversion");
assert.notStrictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionRoute().map(exercise => exercise.promptKey).join("|"),
  routeBeforeChordEdit,
  "changing a chord immediately replaces stale preview data"
);
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreviewList.children.length, 3, "the regenerated preview contains one keyboard card per current chord");
assert(
  elementDescendants(progressionBuilderUi.elements.playProgressionSequence)
    .some(element => element.tagName === "STRONG" && element.textContent.includes("Am7")),
  "the visible chord label updates immediately from the edited chord data"
);

assert.strictEqual(
  progressionInversionControls(progressionBuilderUi).length,
  3,
  "Choose Inversions renders one editable inversion control for every chord"
);
progressionBuilderUi.elements.playProgressionVoicingMethod.value = "nearest";
progressionBuilderUi.elements.playProgressionVoicingMethod.dispatch("change");
assert.strictEqual(
  progressionInversionControls(progressionBuilderUi).length,
  1,
  "Nearest Voicings renders an editable inversion control only for chord 1"
);
assert(
  /Starting inversion/i.test(progressionInversionControls(progressionBuilderUi)[0].attributes["aria-label"]),
  "Nearest Voicings identifies chord 1 as the starting inversion"
);
assert.strictEqual(
  progressionBuilderUi.elements.playProgressionInversionControl.hidden,
  true,
  "the Add a Chord panel hides inversion after the first nearest-voicing chord"
);
assert.strictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionRoute().length,
  3,
  "Nearest Voicings calculates automatically without pressing Build"
);
assert.deepStrictEqual(
  [...progressionBuilderUi.elements.playProgressionPreviewList.children.map(card => card.children[1].textContent)],
  [...progressionBuilderUi.api.getChordPracticeProgressionRoute().map(exercise => exercise.inversionName)],
  "previewed inversions match the current nearest-voicing calculation"
);
const nearestStartingInversion = progressionInversionControls(progressionBuilderUi)[0];
nearestStartingInversion.value = "2";
nearestStartingInversion.dispatch("change");
assert.strictEqual(progressionBuilderUi.api.getChordPracticeProgressionRoute()[0].inversion, 2, "changing the starting inversion immediately updates the preview route");
const itemsBeforePreviewToggle = JSON.stringify(progressionBuilderUi.api.getChordPracticeProgressionItems());
progressionBuilderUi.elements.playProgressionEditButton.dispatch("click");
assert.strictEqual(progressionBuilderUi.elements.playProgressionEditor.hidden, false, "Edit Progression keeps the real editable controls visible instead of opening a read-only state");
assert.strictEqual(progressionBuilderUi.elements.playProgressionPreviewList.hidden, false, "Edit Progression does not introduce an extra preview step");
assert.strictEqual(progressionBuilderUi.elements.playProgressionStartButton.hidden, false, "one Start Progression action remains sufficient while editing");
assert.strictEqual(JSON.stringify(progressionBuilderUi.api.getChordPracticeProgressionItems()), itemsBeforePreviewToggle, "refocusing the editor preserves chord choices, order, and starting inversion");
assert.strictEqual(progressionBuilderUi.getActiveElement(), progressionBuilderUi.elements.playProgressionAddHeading, "Edit Progression returns focus to the editor heading");
progressionBuilderUi.elements.playProgressionVoicingMethod.value = "manual";
progressionBuilderUi.elements.playProgressionVoicingMethod.dispatch("change");
assert.strictEqual(
  progressionInversionControls(progressionBuilderUi).length,
  3,
  "switching back to Choose Inversions restores every editable inversion control"
);
assert.strictEqual(
  progressionBuilderUi.api.getChordPracticeProgressionRoute().length,
  3,
  "Choose Inversions also refreshes its preview automatically"
);

const progressionRowActionsUi = createHarness({ mode: "play" });
progressionRowActionsUi.elements.playPracticeType.value = "progression";
progressionRowActionsUi.elements.playPracticeType.dispatch("change");
progressionRowActionsUi.elements.playProgressionSource.value = "custom";
progressionRowActionsUi.elements.playProgressionSource.dispatch("change");
progressionRowActionsUi.elements.playProgressionClearButton.dispatch("click");
assert.strictEqual(progressionRowActionsUi.api.getChordPracticeProgressionItems().length, 0, "Clear All empties the custom progression");
progressionRowActionsUi.elements.playProgressionRoot.value = "0";
progressionRowActionsUi.elements.playProgressionChordType.value = "major";
progressionRowActionsUi.elements.playProgressionInversion.value = "0";
progressionRowActionsUi.elements.playProgressionAddButton.dispatch("click");
progressionRowActionsUi.elements.playProgressionRoot.value = "5";
progressionRowActionsUi.elements.playProgressionAddButton.dispatch("click");
assert.strictEqual(progressionRowActionsUi.api.getChordPracticeProgressionItems().length, 2, "Add Chord appends the selected chords");
let rowActionButtons = elementDescendants(progressionRowActionsUi.elements.playProgressionSequence)
  .filter(element => element.tagName === "BUTTON");
rowActionButtons.find(button => /Duplicate progression chord 1/.test(button.attributes["aria-label"])).dispatch("click");
assert.strictEqual(progressionRowActionsUi.api.getChordPracticeProgressionItems().length, 3, "the compact Duplicate action remains functional");
rowActionButtons = elementDescendants(progressionRowActionsUi.elements.playProgressionSequence)
  .filter(element => element.tagName === "BUTTON");
rowActionButtons.find(button => /Move progression chord 3 earlier/.test(button.attributes["aria-label"])).dispatch("click");
assert.strictEqual(progressionRowActionsUi.api.getChordPracticeProgressionItems()[1].rootPitchClass, 5, "the compact reorder action remains functional");
rowActionButtons = elementDescendants(progressionRowActionsUi.elements.playProgressionSequence)
  .filter(element => element.tagName === "BUTTON");
rowActionButtons.find(button => /Remove progression chord 1/.test(button.attributes["aria-label"])).dispatch("click");
assert.strictEqual(progressionRowActionsUi.api.getChordPracticeProgressionItems().length, 2, "the compact Remove action remains functional");

assert(html.includes("Your Progression <span id=\"playProgressionCount\""), "the progression count and Clear All share the list header");
assert(!html.includes('id="playProgressionBuildButton"'), "the obsolete Build button is removed from the interface");
assert(!html.includes("Nearest voicings built."), "the obsolete build-success message is removed");
assert(!html.includes("progression-readonly-field"), "calculated progression details are shown only in the keyboard preview");
assert(!html.includes("View Preview"), "no View Preview action is rendered");
assert(/id="playProgressionPreviewList"[\s\S]*id="playProgressionStartButton"/.test(html), "Start Progression appears immediately after the preview cards");
assert(/@media \(max-width: 600px\)[\s\S]*?\.progression-step-editor \{[\s\S]*?grid-template-columns: 1fr;/.test(html), "the Add a Chord panel stacks without horizontal scrolling on narrow screens");
assert(/@media \(max-width: 600px\)[\s\S]*?\.progression-step-fields,[\s\S]*?\.progression-options-row \{[\s\S]*?grid-template-columns: 1fr;/.test(html), "row fields and practice options wrap to one column on narrow screens");

const manualProgressionItems = [
  midiApi.createChordPracticeItem(0, "major", 0),
  midiApi.createChordPracticeItem(9, "minor", 1),
  midiApi.createChordPracticeItem(5, "major", 2),
  midiApi.createChordPracticeItem(7, "major", 1)
];
const manualProgressionRoute = midiApi.buildChordPracticeProgression({
  progressionItems: manualProgressionItems,
  voicingMethod: "manual"
}, cMajor);
assert.deepStrictEqual(
  [...manualProgressionRoute.map(exercise => exercise.inversion)],
  [0, 1, 2, 1],
  "Choose Inversions preserves every manually selected inversion"
);
assert(manualProgressionRoute.every(exercise =>
  exercise.voicing.midi.map(note => ((note % 12) + 12) % 12)
    .every((pitchClass, index) => pitchClass === exercise.orderedPitchClasses[index])
), "manual progression diagrams and MIDI targets share each exact inversion");

const nearestProgressionItems = [
  midiApi.createChordPracticeItem(0, "major", 0),
  midiApi.createChordPracticeItem(9, "minor", 0),
  midiApi.createChordPracticeItem(5, "major", 0),
  midiApi.createChordPracticeItem(7, "major", 0)
];
const nearestSettings = {
  progressionItems: nearestProgressionItems,
  voicingMethod: "nearest"
};
const nearestProgressionRoute = midiApi.buildChordPracticeProgression(nearestSettings, cMajor);
const repeatedNearestProgressionRoute = midiApi.buildChordPracticeProgression(nearestSettings, cMajor);
assert.strictEqual(nearestProgressionRoute[0].inversion, 0, "Nearest Voicings preserves the selected starting inversion");
assert.deepStrictEqual(
  nearestProgressionRoute.map(exercise => [...exercise.voicing.midi]),
  repeatedNearestProgressionRoute.map(exercise => [...exercise.voicing.midi]),
  "identical progression settings produce a deterministic nearest-voicing route"
);
for (let index = 1; index < nearestProgressionRoute.length; index += 1) {
  const previous = nearestProgressionRoute[index - 1];
  const current = nearestProgressionRoute[index];
  const candidates = midiApi.generateChordVoicings(current.chord, { min: 44, max: 76 });
  const independentlyNearest = midiApi.selectBestVoicing(previous.voicing.midi, candidates, cMajor);
  assert.deepStrictEqual([...current.voicing.midi], [...independentlyNearest.midi], `progression step ${index + 1} uses the shared minimum-movement scorer`);
  assert(current.voicing.midi.every((note, noteIndex, notes) => noteIndex === 0 || notes[noteIndex - 1] < note), "nearest voicing avoids voice crossing");
}
assert.deepStrictEqual([...nearestProgressionRoute[1].voicing.midi], [60, 64, 69], "C major to A minor preserves C and E when that is optimal");
assert.strictEqual(
  midiApi.movementHintForExercises(nearestProgressionRoute[0], nearestProgressionRoute[1]),
  "Keep C and E; move G up to A.",
  "movement guidance is derived from the exact generated transition"
);
const nearestDiagram = midiApi.buildKeyboardVoicingDiagramData({
  midiNotes: nearestProgressionRoute[1].voicing.midi,
  noteNames: nearestProgressionRoute[1].orderedNoteNames,
  chordToneRoles: midiApi.keyboardChordToneRoles(nearestProgressionRoute[1]),
  rootPitchClass: nearestProgressionRoute[1].chord.rootPitchClass,
  chordName: nearestProgressionRoute[1].chord.name,
  inversion: nearestProgressionRoute[1].inversionName
});
assert.deepStrictEqual([...nearestDiagram.targetMidi], [...nearestProgressionRoute[1].voicing.midi], "generated notes, piano preview, and MIDI grading use the same route voicing");
const mixedCardinalityRoute = midiApi.buildChordPracticeProgression({
  progressionItems: [
    midiApi.createChordPracticeItem(0, "major", 0),
    midiApi.createChordPracticeItem(0, "major-seven", 0)
  ],
  voicingMethod: "nearest"
}, cMajor);
assert.strictEqual(mixedCardinalityRoute.length, 2, "nearest progression safely supports moving from a triad to a four-note chord");
assert.strictEqual(mixedCardinalityRoute[1].voicing.midi.length, 4, "mixed-cardinality route preserves the target chord's full note count");

const progressionSession = createHarness({ mode: "play", playDifficulty: "guided" });
progressionSession.elements.playPracticeType.value = "progression";
progressionSession.elements.playPracticeType.dispatch("change");
progressionSession.elements.playProgressionSource.value = "custom";
progressionSession.elements.playProgressionSource.dispatch("change");
progressionSession.api.clearChordPracticeProgression();
manualProgressionItems.slice(0, 3).forEach(item =>
  progressionSession.api.addChordPracticeProgressionItem(item)
);
progressionSession.elements.playProgressionRepeat.checked = false;
progressionSession.elements.playProgressionRepeat.dispatch("change");
const previewedProgressionMidi = progressionSession.api.getChordPracticeProgressionRoute()
  .map(exercise => [...exercise.voicing.midi]);
progressionSession.elements.playProgressionStartButton.dispatch("click");
assert.strictEqual(progressionSession.elements.playScreen.hidden, false, "a non-empty progression starts in the existing Chord Practice session view");
assert.deepStrictEqual(
  progressionSession.api.getChordPracticeProgressionRoute().map(exercise => [...exercise.voicing.midi]),
  previewedProgressionMidi,
  "Start Progression uses the exact MIDI voicings shown in the preview without recalculating"
);
assert.strictEqual(progressionSession.elements.playSetProgress.textContent, "Chord 1 of 3", "progression practice shows the current ordered position");
assert.strictEqual(progressionSession.elements.playKeyboardDiagram.children.length, 1, "Guided progression keeps the large target keyboard diagram");
const firstProgressionExercise = progressionSession.api.getCurrentPlayExercise();
assert.deepStrictEqual([...firstProgressionExercise.voicing.midi], [...previewedProgressionMidi[0]], "the first session keyboard diagram uses the first previewed voicing");
playMidiChord(progressionSession, firstProgressionExercise.voicing.midi);
assert.strictEqual(progressionSession.elements.playMidiFeedback.textContent, "✓ Correct", "progression MIDI grading accepts the exact displayed voicing");
progressionSession.elements.playNextButton.dispatch("click");
assert.strictEqual(progressionSession.elements.playSetProgress.textContent, "Chord 2 of 3", "Next preserves progression order");
assert.strictEqual(progressionSession.elements.playProgressionReference.hidden, false, "later targets show the previous voicing as a compact reference");
assert(progressionSession.elements.playPreviousVoicing.textContent.startsWith("Previous:"), "the completed chord never becomes another large target card");
assert(progressionSession.elements.playMovementHint.textContent.length > 0, "movement hints appear when enabled");
progressionSession.elements.playNextButton.dispatch("click");
progressionSession.elements.playNextButton.dispatch("click");
assert.strictEqual(progressionSession.elements.playResponse.textContent, "Progression complete.", "Repeat Progression off stops after the final chord");

const repeatingProgressionSession = createHarness({ mode: "play" });
repeatingProgressionSession.elements.playPracticeType.value = "progression";
repeatingProgressionSession.elements.playPracticeType.dispatch("change");
repeatingProgressionSession.elements.playProgressionSource.value = "custom";
repeatingProgressionSession.elements.playProgressionSource.dispatch("change");
repeatingProgressionSession.api.clearChordPracticeProgression();
nearestProgressionItems.slice(0, 2).forEach(item =>
repeatingProgressionSession.api.addChordPracticeProgressionItem(item)
);
repeatingProgressionSession.elements.playProgressionRepeat.checked = true;
repeatingProgressionSession.elements.playProgressionStartButton.dispatch("click");
const repeatingFirstSymbol = repeatingProgressionSession.api.getCurrentPlayExercise().chordSymbol;
repeatingProgressionSession.elements.playNextButton.dispatch("click");
repeatingProgressionSession.elements.playNextButton.dispatch("click");
assert.strictEqual(repeatingProgressionSession.api.getCurrentPlayExercise().chordSymbol, repeatingFirstSymbol, "Repeat Progression returns to chord 1 after the final chord");

const commonProgressionStorage = new Map();
const savedCommonProgression = createHarness({ mode: "play" }, commonProgressionStorage);
savedCommonProgression.elements.playPracticeType.value = "progression";
savedCommonProgression.elements.playPracticeType.dispatch("change");
savedCommonProgression.elements.playProgressionVoicingMethod.value = "nearest";
savedCommonProgression.elements.playProgressionVoicingMethod.dispatch("change");
savedCommonProgression.elements.playCommonProgressionSelect.value = "ii-V-I";
savedCommonProgression.elements.playCommonProgressionSelect.dispatch("change");
savedCommonProgression.elements.playCommonStartingInversion.value = "1";
savedCommonProgression.elements.playCommonStartingInversion.dispatch("change");
const restoredCommonProgression = createHarness({ mode: "play" }, commonProgressionStorage);
assert.strictEqual(restoredCommonProgression.elements.playProgressionSource.value, "common", "common progression source persists");
assert.strictEqual(restoredCommonProgression.elements.playCommonProgressionSelect.value, "ii-V-I", "selected common progression persists");
assert.strictEqual(restoredCommonProgression.elements.playCommonStartingInversion.value, "1", "common starting inversion persists");
assert.strictEqual(restoredCommonProgression.api.getChordPracticeProgressionRoute()[0].inversion, 1, "the restored common preview uses its saved starting inversion");
assert.strictEqual(restoredCommonProgression.elements.playProgressionEditor.hidden, true, "restored common progressions do not revive the read-only list");

const progressionPersistenceStorage = new Map();
const savedProgression = createHarness({ mode: "play" }, progressionPersistenceStorage);
savedProgression.elements.playPracticeType.value = "progression";
savedProgression.elements.playPracticeType.dispatch("change");
savedProgression.elements.playProgressionSource.value = "custom";
savedProgression.elements.playProgressionSource.dispatch("change");
savedProgression.api.clearChordPracticeProgression();
nearestProgressionItems.forEach(item => savedProgression.api.addChordPracticeProgressionItem(item));
savedProgression.elements.playProgressionVoicingMethod.value = "nearest";
savedProgression.elements.playProgressionVoicingMethod.dispatch("change");
savedProgression.elements.playProgressionShowHints.checked = false;
savedProgression.elements.playProgressionShowHints.dispatch("change");
savedProgression.elements.playProgressionRepeat.checked = false;
savedProgression.elements.playProgressionRepeat.dispatch("change");
const restoredProgression = createHarness({ mode: "play" }, progressionPersistenceStorage);
assert.strictEqual(restoredProgression.elements.playPracticeType.value, "progression", "last-used Practice Type persists");
assert.strictEqual(restoredProgression.elements.playProgressionSource.value, "custom", "custom progression source persists");
assert.strictEqual(restoredProgression.elements.playProgressionVoicingMethod.value, "nearest", "Nearest Voicings persists");
assert.strictEqual(restoredProgression.elements.playProgressionShowHints.checked, false, "Show Movement Hints persists");
assert.strictEqual(restoredProgression.elements.playProgressionRepeat.checked, false, "Repeat Progression persists");
assert.strictEqual(restoredProgression.elements.playProgressionEditor.hidden, false, "old saved progressions restore into the live editable workflow");
assert.strictEqual(restoredProgression.api.getChordPracticeProgressionItems().length, 4, "custom progression steps persist");
assert.strictEqual(restoredProgression.api.getChordPracticeProgressionRoute().length, 4, "exact generated nearest voicings persist between sessions");
assert.strictEqual(
  JSON.stringify(restoredProgression.api.getChordPracticeProgressionRoute().map(exercise => [...exercise.voicing.midi])),
  JSON.stringify(savedProgression.api.getChordPracticeProgressionRoute().map(exercise => [...exercise.voicing.midi])),
  "restored progression uses the same generated MIDI route"
);
restoredProgression.elements.homeKeyboardButton.dispatch("click");
assert.strictEqual(restoredProgression.elements.setupScreen.hidden, false, "Keyboard opens the restored Chord Practice setup directly");
assert.strictEqual(restoredProgression.elements.playPracticeType.value, "progression", "direct Keyboard navigation preserves the last-used Chord Practice mode");

if (process.env.MUSICIANSHIP_TEST_SCOPE === "progression-builder") {
  console.log("PASS: Chord Practice preset/custom separation, compact editing, live preview, one-step Start, and persistence verified");
  process.exit(0);
}

const legacyKeyboardVoiceStorage = new Map([
  ["music-trainer-selected-mode", "voice"],
  ["voice-leading-selected-key", "g-major"],
  ["voice-leading-settings", JSON.stringify({
    exerciseType: "progression",
    progressionSource: "choose",
    progressionSequence: ["I", "vi", "IV", "V"]
  })],
  ["musicianship-last-session", JSON.stringify({
    tool: "voice",
    exerciseId: "keyboard.voice_leading"
  })]
]);
const migratedKeyboardVoice = createHarness({}, legacyKeyboardVoiceStorage);
assert.strictEqual(migratedKeyboardVoice.api.getSelectedMode(), "play", "old Keyboard Voice Leading mode migrates to Chord Practice");
assert.strictEqual(migratedKeyboardVoice.elements.playPracticeType.value, "progression", "old Keyboard Voice Leading activates Progression mode");
assert.strictEqual(migratedKeyboardVoice.elements.playProgressionVoicingMethod.value, "nearest", "old Keyboard Voice Leading activates Nearest Voicings");
assert.strictEqual(migratedKeyboardVoice.api.getChordPracticeProgressionItems().length, 4, "old guided progression sequence is preserved");
assert.strictEqual(JSON.parse(legacyKeyboardVoiceStorage.get("musicianship-last-session")).tool, "play", "old last-session route is rewritten to Chord Practice");
const legacyKeyboardVoiceRoute = createHarness({ mode: "play" });
legacyKeyboardVoiceRoute.api.exerciseRegistry["keyboard.voice_leading"].start();
assert.strictEqual(legacyKeyboardVoiceRoute.elements.playScreen.hidden, false, "the old stable Voice Leading route starts Chord Practice");
assert.strictEqual(legacyKeyboardVoiceRoute.elements.playPracticeType.value, "progression", "the old stable Voice Leading route activates Progression");

const customBuilderUi = createHarness({ mode: "play" });
customBuilderUi.elements.playPoolMode.value = "custom";
customBuilderUi.elements.playPoolMode.dispatch("change");
assert.strictEqual(customBuilderUi.elements.playFilterPoolControls.hidden, true, "Custom Set hides broad pool filters");
assert.strictEqual(customBuilderUi.elements.playCustomSetBuilder.hidden, false, "Custom Set reveals the exact-item builder");
customBuilderUi.api.setCustomPracticeItems([exactCFirst, exactFSecond, exactAMinorRoot]);
const customIds = customBuilderUi.api.getCustomPracticeItems().map(item => item.id);
assert.strictEqual(customBuilderUi.elements.playCustomSummary.textContent, "Practice set: 3 voicings", "the setup summarizes the exact custom set");
assert.strictEqual(customBuilderUi.api.moveCustomPracticeItem(customIds[2], -1), true, "custom items can be reordered");
assert.strictEqual(customBuilderUi.api.getCustomPracticeItems()[1].rootPitchClass, 9, "reordering changes Listed order data");
assert.strictEqual(customBuilderUi.api.removeCustomPracticeItem(customIds[0]), true, "one custom item can be removed by stable ID");
assert.strictEqual(customBuilderUi.api.getCustomPracticeItems().length, 2, "removal leaves the remaining exact items intact");
customBuilderUi.api.clearCustomPracticeItems();
assert.strictEqual(customBuilderUi.api.getCustomPracticeItems().length, 0, "Clear All empties the custom set");
customBuilderUi.elements.playCustomChordType.value = "major";
customBuilderUi.elements.playCustomChordType.dispatch("change");
assert.strictEqual(customBuilderUi.elements.playCustomThirdInversionOption.hidden, true, "the custom builder hides third inversion for triads");
customBuilderUi.elements.playCustomChordType.value = "dominant-seven";
customBuilderUi.elements.playCustomChordType.dispatch("change");
assert.strictEqual(customBuilderUi.elements.playCustomThirdInversionOption.hidden, false, "the custom builder offers third inversion for seventh chords");

const customPracticeStorage = new Map();
const savedCustomUi = createHarness({ mode: "play" }, customPracticeStorage);
savedCustomUi.elements.playPoolMode.value = "custom";
savedCustomUi.elements.playPoolMode.dispatch("change");
savedCustomUi.elements.playCustomOrder.value = "listed";
savedCustomUi.elements.playCustomOrder.dispatch("change");
savedCustomUi.elements.playCustomRepeat.checked = false;
savedCustomUi.elements.playCustomRepeat.dispatch("change");
savedCustomUi.api.setCustomPracticeItems([exactCFirst, exactFSecond]);
const restoredCustomUi = createHarness({ mode: "play" }, customPracticeStorage);
assert.strictEqual(restoredCustomUi.elements.playPoolMode.value, "custom", "the most recent Custom Set mode restores");
assert.strictEqual(restoredCustomUi.api.getCustomPracticeItems().length, 2, "the most recent exact item list restores");
assert.strictEqual(restoredCustomUi.elements.playCustomOrder.value, "listed", "custom Listed order restores");
assert.strictEqual(restoredCustomUi.elements.playCustomRepeat.checked, false, "custom Repeat list restores");

restoredCustomUi.elements.playCustomSetName.value = "Focused inversions";
const namedSet = restoredCustomUi.api.saveCurrentPracticeSet();
assert(namedSet && restoredCustomUi.api.getSavedPracticeSets().length === 1, "a named practice set saves exact items and options");
restoredCustomUi.api.clearCustomPracticeItems();
assert.strictEqual(restoredCustomUi.api.loadPracticeSet(namedSet.id), true, "a named practice set can be loaded");
assert.strictEqual(restoredCustomUi.api.getCustomPracticeItems().length, 2, "loading restores the saved exact items");
assert.strictEqual(restoredCustomUi.api.renamePracticeSet(namedSet.id, "Renamed set"), true, "a saved set can be renamed");
const duplicatedSet = restoredCustomUi.api.duplicatePracticeSet(namedSet.id);
assert(duplicatedSet && restoredCustomUi.api.getSavedPracticeSets().length === 2, "a saved set can be duplicated");
assert.strictEqual(restoredCustomUi.api.deletePracticeSet(duplicatedSet.id, false), true, "a saved set can be deleted");
const namedSetRestoredUi = createHarness({ mode: "play" }, customPracticeStorage);
assert.strictEqual(namedSetRestoredUi.api.getSavedPracticeSets()[0].name, "Renamed set", "named practice sets persist between sessions");

const exactMidiUi = createHarness({ mode: "play", playDifficulty: "standard" });
exactMidiUi.elements.playPoolMode.value = "custom";
exactMidiUi.elements.playPoolMode.dispatch("change");
exactMidiUi.api.setCustomPracticeItems([exactFSecond]);
exactMidiUi.elements.startButton.dispatch("click");
const exactMidiExercise = exactMidiUi.api.getCurrentPlayExercise();
assert.strictEqual(exactMidiExercise.chord.rootPitchClass, 5, "custom practice displays the selected chord only");
assert.strictEqual(exactMidiExercise.inversion, 2, "custom practice displays the selected inversion only");
assert.deepStrictEqual(
  exactMidiExercise.voicing.midi.map(note => ((note % 12) + 12) % 12),
  exactMidiExercise.orderedPitchClasses,
  "the piano diagram and MIDI target share the custom inversion voicing"
);
playMidiChord(exactMidiUi, exactMidiExercise.voicing.midi);
assert.strictEqual(exactMidiUi.elements.playMidiFeedback.textContent, "✓ Correct", "MIDI grading accepts the exact custom inversion");

const listedUi = createHarness({ mode: "play" });
listedUi.elements.playPoolMode.value = "custom";
listedUi.elements.playPoolMode.dispatch("change");
listedUi.elements.playCustomOrder.value = "listed";
listedUi.elements.playCustomRepeat.checked = false;
listedUi.api.setCustomPracticeItems([exactCFirst, exactFSecond]);
listedUi.elements.startButton.dispatch("click");
assert.strictEqual(listedUi.elements.playSetProgress.textContent, "1 of 2", "Listed order shows compact session progress");
listedUi.elements.playNextButton.dispatch("click");
assert.strictEqual(listedUi.elements.playSetProgress.textContent, "2 of 2", "Next follows the visible custom-list order");
listedUi.elements.playNextButton.dispatch("click");
assert.strictEqual(listedUi.elements.playResponse.textContent, "Practice set complete.", "Repeat off ends the listed session cleanly");

const emptyCustomUi = createHarness({ mode: "play" });
emptyCustomUi.elements.setupScreen.hidden = false;
emptyCustomUi.elements.playPoolMode.value = "custom";
emptyCustomUi.elements.playPoolMode.dispatch("change");
emptyCustomUi.elements.startButton.dispatch("click");
assert.strictEqual(emptyCustomUi.elements.setupScreen.hidden, false, "an empty Custom Set cannot begin practice");
assert.strictEqual(emptyCustomUi.elements.setupIntro.textContent, "Select at least one chord and inversion to begin.", "the empty set shows concise guidance");

const directionSettings = {
  ...chordPracticeBaseSettings,
  rootMode: "selected",
  selectedRoots: [0],
  chordTypeIds: ["major"],
  inversions: [1]
};
for (const [direction, directionIndex] of [["chord-to-play", 0], ["notes-to-name", 1], ["diagram-to-name", 2]]) {
  const fixedExercise = midiApi.generateChordPracticeExercise(
    { ...directionSettings, direction },
    cMajor,
    () => 0
  );
  assert.strictEqual(fixedExercise.promptDirection, direction, `${direction} produces its requested prompt direction`);
  assert.deepStrictEqual([...fixedExercise.orderedNoteNames], ["E", "G", "C"], "one structured exercise object carries the exact inversion spelling");
  assert.deepStrictEqual([...fixedExercise.voicing.midi.map(note => ((note % 12) + 12) % 12)], [...fixedExercise.orderedPitchClasses], "diagram and MIDI grading share the exact generated voicing");
  const mixedRandom = [0, (directionIndex + 0.1) / 3];
  let mixedIndex = 0;
  const mixedExercise = midiApi.generateChordPracticeExercise(
    { ...directionSettings, direction: "mixed" },
    cMajor,
    () => mixedRandom[mixedIndex++]
  );
  assert.strictEqual(mixedExercise.promptDirection, direction, `Mixed can select ${direction}`);
}

const notesNaming = createHarness({ mode: "play", playDifficulty: "standard" });
notesNaming.elements.playPracticeDirection.value = "notes-to-name";
notesNaming.elements.startButton.dispatch("click");
const notesNamingExercise = notesNaming.api.getCurrentPlayExercise();
assert.strictEqual(notesNaming.elements.playPromptNotes.hidden, false, "See notes → Name displays low-to-high target notes");
assert.strictEqual(notesNaming.elements.playChordName.hidden, true, "See notes → Name withholds the chord identity");
assert.strictEqual(notesNaming.elements.playNamingAnswer.hidden, false, "recognition prompts use naming controls instead of requiring MIDI");
notesNaming.elements.playAnswerRoot.value = String(notesNamingExercise.chord.rootPitchClass);
notesNaming.elements.playAnswerChordType.value = notesNamingExercise.chord.formulaId;
notesNaming.elements.playAnswerInversion.value = String(notesNamingExercise.inversion);
notesNaming.elements.playSubmitAnswer.dispatch("click");
assert.strictEqual(notesNaming.elements.playMidiFeedback.textContent, "✓ Correct", "correct chord name and inversion are graded without MIDI");
assert.strictEqual(notesNaming.elements.playAnswer.hidden, false, "correct naming reveals notes and the piano diagram");

const diagramNaming = createHarness({ mode: "play", playDifficulty: "challenge" });
diagramNaming.elements.playPracticeDirection.value = "diagram-to-name";
diagramNaming.elements.startButton.dispatch("click");
assert.strictEqual(diagramNaming.elements.playPromptDiagram.hidden, false, "See diagram → Name always shows the diagram as the prompt");
assert.strictEqual(diagramNaming.elements.playPromptKeyboardDiagram.children.length, 1, "diagram prompt uses the reusable piano component");
assert.strictEqual(diagramNaming.elements.playChordName.hidden, true, "diagram recognition withholds the chord name");
assert.strictEqual(diagramNaming.elements.playAnswer.hidden, true, "Challenge withholds the supporting answer until Reveal");
diagramNaming.elements.playRevealButton.dispatch("click");
assert.strictEqual(diagramNaming.elements.playAnswer.hidden, false, "Challenge Reveal shows the full recognition answer");

const incorrectNaming = createHarness({ mode: "play" });
incorrectNaming.elements.playPracticeDirection.value = "notes-to-name";
incorrectNaming.elements.startButton.dispatch("click");
const incorrectNamingExercise = incorrectNaming.api.getCurrentPlayExercise();
incorrectNaming.elements.playAnswerRoot.value = String(incorrectNamingExercise.chord.rootPitchClass);
incorrectNaming.elements.playAnswerChordType.value = incorrectNamingExercise.chord.formulaId === "major" ? "minor" : "major";
incorrectNaming.elements.playAnswerInversion.value = String(incorrectNamingExercise.inversion);
incorrectNaming.elements.playSubmitAnswer.dispatch("click");
assert.strictEqual(incorrectNaming.elements.playMidiFeedback.textContent, "Incorrect chord quality", "recognition distinguishes an incorrect quality");
incorrectNaming.elements.playAnswerChordType.value = incorrectNamingExercise.chord.formulaId;
incorrectNaming.elements.playAnswerInversion.value = String((incorrectNamingExercise.inversion + 1) % 3);
incorrectNaming.elements.playSubmitAnswer.dispatch("click");
assert.strictEqual(incorrectNaming.elements.playMidiFeedback.textContent, "Correct chord, wrong inversion", "recognition distinguishes an incorrect inversion");

const diminishedSeventh = midiApi.createPracticeChord(0, "diminished-seven", "C");
const diminishedSeventhVoicing = midiApi.choosePracticeVoicing(diminishedSeventh, 0, cMajor);
const diminishedSeventhExercise = {
  key: cMajor,
  chord: diminishedSeventh,
  inversion: 0,
  inversionName: "root position",
  voicing: diminishedSeventhVoicing,
  orderedPitchClasses: diminishedSeventhVoicing.midi.map(note => ((note % 12) + 12) % 12)
};
assert.strictEqual(
  midiApi.gradeChordPracticeNamingAnswer(diminishedSeventhExercise, {
    rootPitchClass: 3,
    formulaId: "diminished-seven",
    inversion: 3
  }).correct,
  true,
  "a musically equivalent diminished-seventh name and matching inversion is accepted"
);

const seventhMidi = createHarness({ mode: "play", playDifficulty: "standard" });
["playChordMajor", "playChordMinor"].forEach(id => { seventhMidi.elements[id].checked = false; });
seventhMidi.elements.playChordDominant7.checked = true;
seventhMidi.elements.playInversionFirst.checked = false;
seventhMidi.elements.playInversionSecond.checked = false;
seventhMidi.elements.playInversionThird.checked = false;
seventhMidi.elements.startButton.dispatch("click");
const seventhMidiExercise = seventhMidi.api.getCurrentPlayExercise();
assert.strictEqual(seventhMidiExercise.voicing.midi.length, 4, "seventh-chord performance prompts expect four MIDI notes");
playMidiChord(seventhMidi, seventhMidiExercise.voicing.midi);
assert.strictEqual(seventhMidi.elements.playMidiFeedback.textContent, "✓ Correct", "four-note MIDI grading accepts the requested seventh chord voicing");

const inversionVisibility = createHarness({ mode: "play" });
assert.strictEqual(inversionVisibility.elements.playThirdInversionOption.hidden, true, "third inversion is hidden for a triad-only pool");
inversionVisibility.elements.playChordDominant7.checked = true;
inversionVisibility.elements.playChordDominant7.dispatch("change");
assert.strictEqual(inversionVisibility.elements.playThirdInversionOption.hidden, false, "third inversion appears when a seventh chord is enabled");
inversionVisibility.elements.playRootMode.value = "diatonic";
inversionVisibility.elements.playRootMode.dispatch("change");
assert.strictEqual(inversionVisibility.elements.playKeyWrap.hidden, false, "Diatonic chords in a key reveals the key selector");
assert.strictEqual(inversionVisibility.elements.playSelectedRoots.hidden, true, "Diatonic mode keeps the chromatic root checklist out of the way");
inversionVisibility.elements.playRootMode.value = "selected";
inversionVisibility.elements.playRootMode.dispatch("change");
assert.strictEqual(inversionVisibility.elements.playSelectedRoots.hidden, false, "Selected roots reveals the twelve-root checklist");

const chordPracticeSummary = createHarness({ mode: "play" });
chordPracticeSummary.elements.startButton.dispatch("click");
chordPracticeSummary.elements.playRestartButton.dispatch("click");
assert.strictEqual(chordPracticeSummary.elements.playSessionSummary.hidden, false, "ending Chord Practice shows a concise session summary");
assert(chordPracticeSummary.elements.playSessionSummary.textContent.includes("completed"), "session summary reports completed exercises");
assert(chordPracticeSummary.elements.playSessionSummary.textContent.includes("root position") ||
  chordPracticeSummary.elements.playSessionSummary.textContent.includes("inversion"), "session summary reports practiced inversions");

const chordPracticePersistence = new Map();
const savedChordPractice = createHarness({ mode: "play" }, chordPracticePersistence);
savedChordPractice.elements.playPracticeDirection.value = "diagram-to-name";
savedChordPractice.elements.playRootMode.value = "selected";
savedChordPractice.elements.playRootC.checked = true;
savedChordPractice.elements.playRootDb.checked = false;
savedChordPractice.elements.playChordMajor.checked = false;
savedChordPractice.elements.playChordMinor.checked = true;
savedChordPractice.elements.playInversionRoot.checked = false;
savedChordPractice.elements.playInversionFirst.checked = true;
savedChordPractice.elements.playPracticeDirection.dispatch("change");
const restoredChordPractice = createHarness({ mode: "play" }, chordPracticePersistence);
assert.strictEqual(restoredChordPractice.elements.playPracticeDirection.value, "diagram-to-name", "practice direction persists");
assert.strictEqual(restoredChordPractice.elements.playRootMode.value, "selected", "root mode persists");
assert.strictEqual(restoredChordPractice.elements.playChordMajor.checked, false, "chord pool persists");
assert.strictEqual(restoredChordPractice.elements.playChordMinor.checked, true, "multiple chord-filter states restore");
assert.strictEqual(restoredChordPractice.elements.playInversionRoot.checked, false, "inversion selection persists");

const legacyChordPracticeStorage = new Map([
  ["music-trainer-selected-mode", "triad"],
  ["musicianship-last-session", JSON.stringify({ tool: "triad", exerciseId: "keyboard.triad_display" })],
  ["play-the-chord-settings", JSON.stringify({ difficulty: "standard", exactRegister: true })]
]);
const migratedChordPractice = createHarness({}, legacyChordPracticeStorage);
assert.strictEqual(migratedChordPractice.api.getSelectedMode(), "play", "old Triad Trainer selected mode migrates to Chord Practice");
assert.strictEqual(migratedChordPractice.elements.continueSessionContext.textContent.includes("Chord Practice"), true, "old last-session data redirects to Chord Practice");
assert.strictEqual(migratedChordPractice.elements.playPracticeDirection.value, "chord-to-play", "old Play the Chord settings receive the new default direction");
assert.strictEqual(migratedChordPractice.elements.playExactRegister.checked, true, "compatible legacy Play the Chord options are preserved during migration");

assert.deepStrictEqual(
  Object.keys(midiApi.exerciseRegistry),
  [
    "keyboard.chord_practice",
    "keyboard.triad_display",
    "keyboard.voice_leading",
    "keyboard.play_chord",
    "fretboard.triads",
    "fretboard.key_study",
    "fretboard.voice_leading",
    "fretboard.triad_shapes.study",
    "fretboard.triad_shapes.quiz",
    "theory.chord_identifier"
  ],
  "current trainers are registered under stable exercise IDs"
);
assert.strictEqual(midiApi.exerciseRegistry["keyboard.triad_display"].aliasTo, "keyboard.chord_practice", "Recognize Triads stable ID redirects to Chord Practice");
assert.strictEqual(midiApi.exerciseRegistry["keyboard.play_chord"].aliasTo, "keyboard.chord_practice", "Play the Chord stable ID redirects to Chord Practice");
assert.strictEqual(midiApi.exerciseRegistry["fretboard.triads"].aliasTo, "fretboard.voice_leading", "the retired Fretboard Practice ID redirects to Voice Leading");
assert.strictEqual(midiApi.exerciseRegistry["fretboard.key_study"].aliasTo, "fretboard.voice_leading", "the old Key Study ID redirects to Voice Leading");
assert.strictEqual(midiApi.fretboardVoiceViewIds.route, "fretboard.voice_leading.route", "Route has a stable internal view ID");
assert.strictEqual(midiApi.fretboardVoiceViewIds["shape-library"], "fretboard.voice_leading.shape_library", "Shape Library has a stable internal view ID");
assert.strictEqual(midiApi.triadShapesViewIds.study, "fretboard.triad_shapes.study", "Triad Shapes Study has a stable direct route");
assert.strictEqual(midiApi.triadShapesViewIds.quiz, "fretboard.triad_shapes.quiz", "Triad Shapes Quiz has a stable direct route");
assert.deepStrictEqual(
  Object.keys(midiApi.musicianshipEngine),
  ["music", "keyboard", "fretboard", "exercise"],
  "music, keyboard, fretboard, and exercise responsibilities remain independently addressable"
);

for (const generatedKey of Object.values(midiApi.keys)) {
  assert.deepStrictEqual(
    [...generatedKey.referenceChords.map(referenceChord => referenceChord.degree)],
    ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    `${generatedKey.displayName} reference keeps all seven diatonic triads in scale-degree order`
  );
  const diminished = generatedKey.referenceChords[6];
  assert.strictEqual(diminished.quality, "diminished", "the leading-tone triad is diminished");
  assert.deepStrictEqual(
    [...diminished.noteNames],
    [generatedKey.scaleNotes[6], generatedKey.scaleNotes[1], generatedKey.scaleNotes[3]],
    "the diminished triad uses theoretical scale spelling"
  );
}

const defaultKeyStudy = midiApi.generateKeyStudyReference(cMajor, {});
assert.strictEqual(defaultKeyStudy.exerciseId, "fretboard.key_study", "the reused Shape Library engine keeps the legacy stable exercise ID");
assert.deepStrictEqual(
  [...defaultKeyStudy.sections.map(section => section.chord.degree)],
  ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  "Shape Library defaults to all seven supported diatonic triads"
);
assert(defaultKeyStudy.sections.every(section => section.items.length === 3), "Chord-by-Chord shows all three inversions by default");
assert(defaultKeyStudy.playableItems.every(item => item.voicing.stringSet === "GBE"), "Key Study defaults to the GBE string set");

const allDiatonicStudy = midiApi.generateKeyStudyReference(cMajor, {
  stringSet: "DGB",
  enabledDegrees: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  enabledInversions: [0, 1, 2],
  quality: "all",
  includeOpen: true,
  fretRange: "any",
  dotLabels: "chord-tones",
  view: "chord",
  ordering: "inversion"
});
assert.deepStrictEqual(
  [...allDiatonicStudy.sections.map(section => section.chord.degree)],
  ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  "All diatonic includes vii° in the expected position"
);
assert(allDiatonicStudy.playableItems.some(item => item.chord.degree === "vii°"), "vii° produces playable calculated reference shapes");
assert(
  allDiatonicStudy.sections.every(section =>
    section.items.map(item => item.inversion).join(",") === "0,1,2"
  ),
  "Inversion ordering preserves root, first, and second order"
);

const majorOnlyStudy = midiApi.generateKeyStudyReference(cMajor, {
  enabledDegrees: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  enabledInversions: [0, 1, 2],
  quality: "major"
});
assert.deepStrictEqual(
  [...majorOnlyStudy.sections.map(section => section.chord.degree)],
  ["I", "IV", "V"],
  "Major-only quality filter shows I, IV, and V"
);
const minorOnlyStudy = midiApi.generateKeyStudyReference(cMajor, {
  enabledDegrees: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  enabledInversions: [0, 1, 2],
  quality: "minor"
});
assert.deepStrictEqual(
  [...minorOnlyStudy.sections.map(section => section.chord.degree)],
  ["ii", "iii", "vi"],
  "Minor-only quality filter shows ii, iii, and vi"
);

const sequenceStudy = midiApi.generateKeyStudyReference(cMajor, {
  stringSet: "ADG",
  enabledDegrees: ["I", "IV", "V", "vi"],
  enabledInversions: [0, 1, 2],
  view: "sequence",
  strategy: "nearest",
  includeOpen: true,
  fretRange: "any"
});
assert(sequenceStudy.sections.every(section => section.items.length === 1), "Scale-Degree Sequence shows one voicing per chord");
assert(sequenceStudy.playableItems.length === 4, "voice-led sequence supplies one playable shape for every selected chord");
for (const item of sequenceStudy.playableItems) {
  assert.deepStrictEqual(
    [...item.tab.lines.slice().reverse().map(line => line.fret)],
    [...item.diagram.strings.map(note => note.fret)],
    "every Key Study diagram and TAB use the same voicing"
  );
}

const narrowRangeStudy = midiApi.generateKeyStudyReference(cMajor, {
  stringSet: "EAD",
  enabledDegrees: ["I", "ii", "iii", "IV", "V", "vi"],
  enabledInversions: [0, 1, 2],
  fretRange: "9-12",
  includeOpen: false
});
assert(
  narrowRangeStudy.playableItems.every(item =>
    item.voicing.frets.every(fret => fret >= 9 && fret <= 12)
  ),
  "Key Study applies the requested fret range strictly"
);

const emptyKeyStudy = midiApi.generateKeyStudyReference(cMajor, {
  enabledDegrees: [],
  enabledInversions: [0, 1, 2]
});
assert.strictEqual(emptyKeyStudy.sections.length, 0, "an empty degree selection produces an explicit empty reference state");

const focusedExercise = midiApi.generateFretboardExercise(
  cMajor,
  {
    stringSet: "GBE",
    enabledDegrees: ["vii°"],
    enabledInversions: [1],
    includeDiminished: true,
    includeOpen: true,
    fretRange: "any"
  },
  () => 0
);
assert.strictEqual(focusedExercise.chord.degree, "vii°", "Practice These can carry the selected diminished degree");
assert.strictEqual(focusedExercise.inversion, 1, "Practice These carries the selected inversion");
assert.strictEqual(focusedExercise.stringSet, "GBE", "Practice These carries the selected string set");

const lowE = midiApi.standardTuning[0];
const aString = midiApi.standardTuning[1];
assert.strictEqual(midiApi.fretboardNoteAt(lowE, 0, cMajor).noteName, "E", "open low E is calculated from standard tuning");
assert.strictEqual(midiApi.fretboardNoteAt(lowE, 1, cMajor).noteName, "F", "low E first fret calculates F");
assert.strictEqual(midiApi.fretboardNoteAt(aString, 3, cMajor).noteName, "C", "A-string third fret calculates C");
assert.strictEqual(midiApi.fretboardNoteAt(aString, 12, cMajor).midi, aString.midi + 12, "fret calculation raises MIDI pitch by the fret number");

assert.deepStrictEqual(
  Object.fromEntries(Object.entries(midiApi.fretboardStringSets).map(([label, strings]) => [
    label,
    strings.map(string => string.label).join("")
  ])),
  { EAD: "EAD", ADG: "ADG", DGB: "DGB", GBE: "GBE" },
  "all four supported string sets use the requested labels"
);

const oneFretGuitarMovement = midiApi.calculateGuitarVoiceMovement(
  [5, 5, 5],
  [5, 5, 6]
);
assert.deepStrictEqual([...oneFretGuitarMovement.perString], [0, 0, 1], "guitar movement is calculated per corresponding string");
assert.deepStrictEqual([...oneFretGuitarMovement.fromFrets], [5, 5, 5], "movement data keeps exact starting frets");
assert.deepStrictEqual([...oneFretGuitarMovement.toFrets], [5, 5, 6], "movement data keeps exact target frets");
assert.strictEqual(oneFretGuitarMovement.commonToneCount, 2, "two same-string positions are retained");
assert.strictEqual(oneFretGuitarMovement.movingVoiceCount, 1, "one guitar voice moves");
assert.strictEqual(oneFretGuitarMovement.total, 1, "one fret of total guitar movement is reported");

function guitarStartingCandidate(keyObject, degree, inversion, stringSet, options = {}) {
  const chordObject = keyObject.chords.find(item => item.degree === degree);
  const musicalObject = midiApi.createMusicalChordObject(keyObject, chordObject, inversion);
  const voicing = midiApi.generateFretboardVoicings(musicalObject, stringSet, {
    includeOpen: true,
    fretRange: "any",
    maxSpan: 4,
    ...options
  })[0];
  assert(voicing, `${keyObject.displayName} ${degree} ${inversion} has a ${stringSet} starting shape`);
  return { inversion, musicalObject, voicing };
}

const cGbeStart = guitarStartingCandidate(cMajor, "I", 1, "GBE");
const cGbeRoute = midiApi.generateGuitarVoiceLeadingRoute(
  cMajor,
  ["I", "ii", "iii", "IV", "V", "vi", "I"],
  cGbeStart,
  {
    stringSet: "GBE",
    fretRange: "any",
    rangeBehavior: "stay",
    includeOpen: true,
    maxSpan: 4
  }
);
assert.strictEqual(cGbeRoute.exerciseId, "fretboard.voice_leading", "guitar voice leading uses its stable internal ID");
assert.deepStrictEqual([...cGbeRoute.degrees], ["I", "ii", "iii", "IV", "V", "vi", "I"], "ascending C-major route preserves chord order");
assert.deepStrictEqual([...cGbeRoute.route[0].frets], [...cGbeStart.voicing.frets], "the exact selected starting frets anchor the route");
assert.strictEqual(cGbeRoute.route[0].inversionIndex, 1, "the selected first inversion anchors the route");
assert(cGbeRoute.route.every(step => step.stringSet === "GBE"), "GBE voices remain on the selected strings for the entire route");
assert(cGbeRoute.route.every(step => step.voicing.span <= 4), "every routed shape respects the four-fret span");
assert(cGbeRoute.route.every(step => step.diagram.strings.some(note => note.isRoot)), "every compact diagram contains an accent-ready root marker");
assert(cGbeRoute.route.every(step => step.diagram.fretNumber !== undefined), "every compact diagram contains explicit fret-window data");

for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
  const start = guitarStartingCandidate(cMajor, "I", 0, stringSet);
  const route = midiApi.generateGuitarVoiceLeadingRoute(
    cMajor,
    ["I", "IV", "V", "I"],
    start,
    {
      stringSet,
      fretRange: "any",
      rangeBehavior: "stay",
      includeOpen: true,
      maxSpan: 4
    }
  );
  assert(route.route.length === 4, `${stringSet} produces a complete representative route`);
  const expectedStringIds = midiApi.fretboardStringSets[stringSet].map(string => string.id);
  route.route.forEach(step => {
    assert.deepStrictEqual(
      [...step.voicing.notes.map(note => note.stringId)],
      [...expectedStringIds],
      `${stringSet} keeps low, middle, and high voices assigned to the same physical strings`
    );
  });
}

const routeSettings = {
  stringSet: "GBE",
  fretRange: "any",
  rangeBehavior: "stay",
  includeOpen: true,
  maxSpan: 4
};
const shortDegrees = ["I", "IV", "V", "I"];
const optimizedShortRoute = midiApi.generateGuitarVoiceLeadingRoute(
  cMajor,
  shortDegrees,
  guitarStartingCandidate(cMajor, "I", 0, "GBE"),
  routeSettings
);
const exhaustiveStart = optimizedShortRoute.route[0];
const exhaustiveCandidates = shortDegrees.slice(1).map(degree => {
  const targetChord = cMajor.chords.find(item => item.degree === degree);
  return midiApi.guitarVoiceLeadingCandidates(cMajor, targetChord, routeSettings);
});
let exhaustiveBestCost = null;
function enumerateGuitarRoutes(index, priorVoicing, cost, path) {
  if (index === exhaustiveCandidates.length) {
    const returnMovement = midiApi.calculateGuitarVoiceMovement(
      priorVoicing.frets,
      exhaustiveStart.voicing.frets
    );
    const finalCost = {
      ...cost,
      totalMovement: cost.totalMovement + returnMovement.total,
      commonToneCount: cost.commonToneCount + returnMovement.commonToneCount,
      movingVoiceCount: cost.movingVoiceCount + returnMovement.movingVoiceCount,
      largestMove: Math.max(cost.largestMove, returnMovement.largestMove),
      returnMovement: returnMovement.total
    };
    if (!exhaustiveBestCost || midiApi.compareGuitarRouteCosts(finalCost, exhaustiveBestCost) < 0) {
      exhaustiveBestCost = finalCost;
    }
    return;
  }
  for (const candidate of exhaustiveCandidates[index]) {
    const movement = midiApi.calculateGuitarVoiceMovement(priorVoicing.frets, candidate.voicing.frets);
    const nextCost = midiApi.addGuitarRouteCost(
      cost,
      movement,
      candidate.voicing,
      { min: 0, max: 12 },
      exhaustiveStart.frets.reduce((sum, fret) => sum + fret, 0) / 3
    );
    enumerateGuitarRoutes(index + 1, candidate.voicing, nextCost, [...path, candidate]);
  }
}
enumerateGuitarRoutes(0, exhaustiveStart.voicing, midiApi.emptyGuitarRouteCost(), []);
assert.strictEqual(
  midiApi.compareGuitarRouteCosts(optimizedShortRoute.cost, exhaustiveBestCost),
  0,
  "whole-progression guitar routing matches an exhaustive lowest-cost search"
);

const flatRoute = midiApi.generateGuitarVoiceLeadingRoute(
  midiApi.keys["a-flat-major"],
  ["I", "IV", "V", "vi"],
  guitarStartingCandidate(midiApi.keys["a-flat-major"], "I", 0, "DGB"),
  { ...routeSettings, stringSet: "DGB" }
);
assert(flatRoute.route.flatMap(step => step.noteNames).some(name => name.includes("b")), "A-flat major DGB route preserves flat spellings");
const sharpRoute = midiApi.generateGuitarVoiceLeadingRoute(
  midiApi.keys["e-major"],
  ["vi", "IV", "I", "V"],
  guitarStartingCandidate(midiApi.keys["e-major"], "vi", 2, "ADG"),
  { ...routeSettings, stringSet: "ADG" }
);
assert.deepStrictEqual([...sharpRoute.degrees], ["vi", "IV", "I", "V"], "E-major ADG route supports a vi second-inversion anchor");
assert(sharpRoute.route.flatMap(step => step.noteNames).some(name => name.includes("#")), "E-major route preserves sharp spellings");
const bFlatRoute = midiApi.generateGuitarVoiceLeadingRoute(
  midiApi.keys["b-flat-major"],
  ["ii", "V", "I"],
  guitarStartingCandidate(midiApi.keys["b-flat-major"], "ii", 1, "EAD"),
  { ...routeSettings, stringSet: "EAD" }
);
assert.deepStrictEqual([...bFlatRoute.degrees], ["ii", "V", "I"], "B-flat major EAD ii–V–I route calculates correctly");
assert.strictEqual(bFlatRoute.route[0].chordName, "C minor", "B-flat major route keeps the correct ii chord name");

const repeatedGuitarRoute = midiApi.generateGuitarVoiceLeadingRoute(
  cMajor,
  ["I", "I", "V", "I"],
  cGbeStart,
  routeSettings
);
assert.deepStrictEqual([...repeatedGuitarRoute.degrees], ["I", "I", "V", "I"], "guitar routing supports intentional repeated chords");
assert.strictEqual(repeatedGuitarRoute.route[1].movementFromPrevious.total, 0, "a repeated chord may retain the exact shape with zero movement");

const openGbeStart = guitarStartingCandidate(cMajor, "I", 2, "GBE", {
  fretRange: "0-4"
});
assert(openGbeStart.voicing.frets.includes(0), "open-string starting anchors use fret 0 when enabled");
const openPositionRoute = midiApi.generateGuitarVoiceLeadingRoute(
  cMajor,
  ["I", "IV", "V", "I"],
  openGbeStart,
  {
    stringSet: "GBE",
    fretRange: "0-4",
    rangeBehavior: "stay",
    includeOpen: true,
    maxSpan: 4
  }
);
assert(openPositionRoute.route.length === 4, "open-position routing finds a complete playable route when one exists");
assert(openPositionRoute.route.every(step => step.frets.every(fret => fret >= 0 && fret <= 4)), "Stay in Range keeps every routed shape inside 0–4");

function fretboardObject(keyObject, degree, inversion) {
  return midiApi.createMusicalChordObject(
    keyObject,
    keyObject.chords.find(item => item.degree === degree),
    inversion
  );
}

for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
  for (let inversion = 0; inversion < 3; inversion += 1) {
    const object = fretboardObject(cMajor, "I", inversion);
    const voicing = midiApi.selectFretboardVoicing(object, stringSet, {
      includeOpen: true,
      fretRange: "any"
    });
    assert(voicing, `C major ${inversion} has a playable ${stringSet} voicing`);
    assert.strictEqual(voicing.notes[0].pitchClass, object.orderedPitchClasses[0], "lowest sounding note defines the requested inversion");
    assert.deepStrictEqual(
      [...new Set(voicing.notes.map(note => note.pitchClass))].sort((a, b) => a - b),
      [...object.chord.pitchClasses].sort((a, b) => a - b),
      "generated fretboard voicing contains the exact chord tones"
    );
    assert(voicing.span <= 4, "generated fretboard voicing stays within a four-fret stretch");
    assert(voicing.frets.every(fret => fret >= 0 && fret <= 12), "generated fretboard voicing stays within frets 0–12");
  }
}

const representativeFretboardPrompts = [
  { degree: "I", inversion: 1, strings: "GBE", notes: ["E", "G", "C"] },
  { degree: "IV", inversion: 2, strings: "DGB", notes: ["C", "F", "A"] },
  { degree: "vi", inversion: 0, strings: "ADG", notes: ["A", "C", "E"] },
  { degree: "V", inversion: 1, strings: "EAD", notes: ["B", "D", "G"] }
];

for (const example of representativeFretboardPrompts) {
  const object = fretboardObject(cMajor, example.degree, example.inversion);
  const voicing = midiApi.selectFretboardVoicing(object, example.strings, {
    includeOpen: true,
    fretRange: "any"
  });
  assert(voicing, `${object.chordName} ${example.strings} representative voicing exists`);
  assert.deepStrictEqual(
    [...voicing.notes.map(note => note.noteName)],
    example.notes,
    `${object.chordName} ${object.inversion.name} spells correctly on ${example.strings}`
  );
  const diagram = midiApi.buildChordDiagramData(object, voicing, "note-names");
  const tab = midiApi.generateFretboardTab(voicing);
  assert.strictEqual(diagram.strings.filter(note => note.isRoot).length, 1, "diagram highlights exactly one root");
  assert.deepStrictEqual(
    [...diagram.strings.map(note => note.fret)],
    [...voicing.frets],
    "diagram frets match the selected voicing"
  );
  assert.deepStrictEqual(
    [...tab.lines].reverse().map(line => line.fret),
    [...diagram.strings.map(note => note.fret)],
    "TAB and chord diagram always show the exact same frets"
  );
  assert.strictEqual(
    midiApi.validateFretboardAnswer({ stringSet: example.strings, frets: voicing.frets }, voicing),
    true,
    "future fretboard input validation accepts the displayed shape"
  );
}

const visualReferenceExamples = [
  { key: cMajor, degree: "I", inversion: 1, strings: "GBE" },
  { key: cMajor, degree: "vi", inversion: 2, strings: "DGB" },
  { key: midiApi.keys["e-flat-major"], degree: "I", inversion: 0, strings: "ADG" },
  { key: midiApi.keys["g-major"], degree: "I", inversion: 1, strings: "EAD" }
];

for (const example of visualReferenceExamples) {
  const object = fretboardObject(example.key, example.degree, example.inversion);
  const voicing = midiApi.selectFretboardVoicing(object, example.strings, {
    includeOpen: true,
    fretRange: "any"
  });
  assert(voicing, `${object.chordName}, ${object.inversion.name}, ${example.strings} has a rendered reference voicing`);
  const diagram = midiApi.buildChordDiagramData(object, voicing, "chord-tones");
  const tab = midiApi.generateFretboardTab(voicing);
  assert.strictEqual(diagram.visibleFrets, 5, "every representative render uses five evenly spaced fret spaces");
  assert.deepStrictEqual(
    diagram.strings.map(note => note.stringLabel).join(""),
    example.strings,
    "representative render preserves the selected low-to-high string order"
  );
  assert.deepStrictEqual(
    tab.lines.slice().reverse().map(line => line.fret),
    diagram.strings.map(note => note.fret),
    "representative render and TAB consume the same voicing frets"
  );
}

const cSecondOnGBE = fretboardObject(cMajor, "I", 2);
const openGBEShapes = midiApi.generateFretboardVoicings(cSecondOnGBE, "GBE", {
  includeOpen: true,
  fretRange: "0-4"
});
assert(openGBEShapes.some(shape => shape.frets.some(fret => fret === 0)), "open-position setting includes valid open-string shapes");
const closedGBEShapes = midiApi.generateFretboardVoicings(cSecondOnGBE, "GBE", {
  includeOpen: false,
  fretRange: "0-4"
});
assert(closedGBEShapes.every(shape => shape.frets.every(fret => fret > 0)), "default closed-position setting excludes every open string");

function findShapeInRange(rangeName) {
  for (const currentChord of cMajor.chords) {
    for (let inversion = 0; inversion < 3; inversion += 1) {
      const object = midiApi.createMusicalChordObject(cMajor, currentChord, inversion);
      for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
        const shapes = midiApi.generateFretboardVoicings(object, stringSet, {
          includeOpen: true,
          fretRange: rangeName
        });
        if (shapes.length) return { object, shape: shapes[0] };
      }
    }
  }
  return null;
}

for (const [rangeName, bounds] of Object.entries({
  "0-4": [0, 4],
  "5-8": [5, 8],
  "9-12": [9, 12]
})) {
  const found = findShapeInRange(rangeName);
  assert(found, `${rangeName} contains at least one generated playable shape`);
  assert(
    found.shape.frets.every(fret => fret >= bounds[0] && fret <= bounds[1]),
    `${rangeName} filtering keeps every displayed fret inside the preferred range`
  );
}

const highRangeShape = findShapeInRange("9-12");
const highRangeDiagram = midiApi.buildChordDiagramData(highRangeShape.object, highRangeShape.shape, "chord-tones");
assert(highRangeDiagram.fretNumber >= 8, "high-position diagram reports the beginning of its cropped range");
assert(highRangeDiagram.anchorFrets.some(anchor => anchor.fret === 9), "high-position diagram labels the conventional ninth-fret anchor");
assert(highRangeDiagram.strings.every(note => ["R", "3", "5"].includes(note.label)), "major diagram uses simple R, 3, and 5 labels");
assert(highRangeDiagram.strings.find(note => note.isRoot).label === "R", "root highlighting is reinforced by the R label");
assert.deepStrictEqual(
  highRangeDiagram.strings.map(note => note.stringLabel).join(""),
  highRangeShape.shape.stringSet,
  "diagram orders lower-pitched strings on the left and higher-pitched strings on the right"
);
assert(
  highRangeDiagram.strings.every((note, index, notes) =>
    index === 0 || note.xRatio > notes[index - 1].xRatio
  ),
  "string positions progress consistently from left to right"
);
assert(
  highRangeDiagram.strings
    .filter(note => note.fret > 0)
    .every(note =>
      note.fretSpaceIndex === note.fret - highRangeDiagram.startFret &&
      note.yRatio > note.fretSpaceIndex / highRangeDiagram.visibleFrets &&
      note.yRatio < (note.fretSpaceIndex + 1) / highRangeDiagram.visibleFrets
    ),
  "every marker is centered inside its fret space rather than on a fret line"
);
assert(
  highRangeDiagram.anchorFrets.every(anchor =>
    anchor.spaceIndex === anchor.fret - highRangeDiagram.startFret &&
    anchor.yRatio === (anchor.spaceIndex + 0.5) / highRangeDiagram.visibleFrets
  ),
  "fret numbers align with the centers of their corresponding fret spaces"
);

const openPositionDiagram = midiApi.buildChordDiagramData(
  cSecondOnGBE,
  openGBEShapes.find(shape => shape.frets.some(fret => fret === 0)),
  "chord-tones"
);
assert.strictEqual(openPositionDiagram.startFret, 1, "a diagram containing open strings clamps to the nut");
assert.strictEqual(openPositionDiagram.endFret, 5, "open-position diagram still shows five neighboring fret spaces");
assert(
  openPositionDiagram.strings.filter(note => note.fret === 0).every(note =>
    note.fretSpaceIndex === -1 && note.yRatio < 0
  ),
  "open-string markers sit clearly above the nut rather than inside fret one"
);
assert(
  openPositionDiagram.anchorFrets.some(anchor => anchor.fret === 3) &&
    openPositionDiagram.anchorFrets.some(anchor => anchor.fret === 5),
  "open-position crop displays multiple conventional anchor frets"
);

function findShapeAtFretTwelve() {
  for (const currentChord of cMajor.chords) {
    for (let inversion = 0; inversion < 3; inversion += 1) {
      const object = midiApi.createMusicalChordObject(cMajor, currentChord, inversion);
      for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
        const shape = midiApi.generateFretboardVoicings(object, stringSet, {
          includeOpen: true,
          fretRange: "9-12"
        }).find(candidate => candidate.frets.includes(12));
        if (shape) return { object, shape };
      }
    }
  }
  return null;
}

const fretTwelveShape = findShapeAtFretTwelve();
assert(fretTwelveShape, "at least one valid calculated voicing occupies fret 12");
const fretTwelveDiagram = midiApi.buildChordDiagramData(
  fretTwelveShape.object,
  fretTwelveShape.shape,
  "chord-tones"
);
assert.strictEqual(fretTwelveDiagram.endFret, 12, "diagram crop clamps cleanly at fret 12");
assert(fretTwelveDiagram.anchorFrets.some(anchor => anchor.fret === 12), "fret 12 is visibly labeled inside the crop");

const cMajorRootDiagram = midiApi.buildChordDiagramData(
  fretboardObject(cMajor, "I", 0),
  midiApi.selectFretboardVoicing(fretboardObject(cMajor, "I", 0), "GBE", {
    includeOpen: true,
    fretRange: "any"
  }),
  "chord-tones"
);
assert.deepStrictEqual(
  [...new Set(cMajorRootDiagram.strings.map(note => note.chordToneLabel))].sort(),
  ["3", "5", "R"],
  "major triads use R, 3, and 5 marker roles"
);
const aMinorDiagram = midiApi.buildChordDiagramData(
  fretboardObject(cMajor, "vi", 2),
  midiApi.selectFretboardVoicing(fretboardObject(cMajor, "vi", 2), "DGB", {
    includeOpen: true,
    fretRange: "any"
  }),
  "chord-tones"
);
assert(aMinorDiagram.strings.some(note => note.chordToneLabel === "♭3"), "minor triads use the flat-three marker label");
const bothLabelDiagram = midiApi.buildChordDiagramData(
  fretboardObject(cMajor, "I", 0),
  midiApi.selectFretboardVoicing(fretboardObject(cMajor, "I", 0), "GBE", {
    includeOpen: true,
    fretRange: "any"
  }),
  "both"
);
assert(bothLabelDiagram.strings.every(note => note.label.includes(" · ")), "Both combines chord-tone roles and note names compactly");

function renderCompactFretboardForTest(diagram) {
  midiApi.renderFretboardDiagram(
    diagram,
    harness.elements.fretboardDiagram,
    { compact: true }
  );
  return harness.elements.fretboardDiagram.children[0];
}

const compactMajorSvg = renderCompactFretboardForTest(cMajorRootDiagram);
assert.strictEqual(compactMajorSvg.attributes.viewBox, "0 0 460 500", "compact renderer retains the existing 460 by 500 drawing dimensions");
assert.strictEqual(compactMajorSvg.attributes["data-compact"], "true", "compact diagrams opt into their own typography scale");
assert.strictEqual(compactMajorSvg.attributes.preserveAspectRatio, "xMidYMid meet", "compact typography scales without changing alignment");
const compactStringLabels = compactMajorSvg.children.filter(child =>
  child.attributes["data-diagram-label"] === "string"
);
assert.strictEqual(compactStringLabels.length, 3, "each selected string receives one compact label");
assert.deepStrictEqual(
  [...compactStringLabels.map(label => label.textContent)].join(""),
  cMajorRootDiagram.stringSet,
  "compact string labels preserve the selected low-to-high string set"
);
compactStringLabels.forEach((label, index) => {
  assert.strictEqual(Number(label.attributes.x), 105 + cMajorRootDiagram.strings[index].xRatio * 300, "each compact string label remains centered over its string");
  assert.strictEqual(label.attributes["text-anchor"], "middle", "string-label centering uses the SVG anchor");
  assert.strictEqual(label.attributes["font-size"], "27", "compact string labels use the larger type scale");
  assert.strictEqual(label.attributes["font-weight"], "900", "compact string labels use strong weight");
  assert(Number(label.attributes.y) > Number(label.attributes["font-size"]) * 0.75, "string labels retain enough top clearance to avoid clipping");
  assert(Number(label.attributes.y) + Number(label.attributes["font-size"]) < 90, "string labels remain above the fretboard without adding height");
});
const compactFretLabels = compactMajorSvg.children.filter(child =>
  child.attributes["data-diagram-label"] === "fret"
);
assert(compactFretLabels.length > 0, "compact diagrams retain the useful fret anchors chosen by the shared data renderer");
compactFretLabels.forEach(label => {
  const anchor = cMajorRootDiagram.anchorFrets.find(item => String(item.fret) === label.textContent);
  assert(anchor, "each rendered fret number comes from a diagram anchor");
  assert.strictEqual(Number(label.attributes.x), 52, "compact fret numbers have additional separation from the grid");
  assert.strictEqual(Number(label.attributes.y), 90 + anchor.yRatio * 350, "fret numbers remain aligned to fret-space centers");
  assert.strictEqual(label.attributes["font-weight"], "850", "compact fret numbers use a heavier weight");
  assert(Number(label.attributes["font-size"]) >= 27, "compact fret numbers use the larger type scale");
  const nearestBoundaryDistance = Math.min(...Array.from({ length: 6 }, (_, index) =>
    Math.abs(Number(label.attributes.y) - (90 + index * 70))
  ));
  assert(nearestBoundaryDistance >= 35, "fret numbers never sit on a fret line");
});
const compactMarkerCircles = compactMajorSvg.children.filter(child =>
  child.tagName === "CIRCLE" && child.attributes["data-role"]
);
const compactFretLines = compactMajorSvg.children.filter(child =>
  child.tagName === "LINE" && child.attributes["data-fret-boundary"] !== undefined
);
const compactStringLines = compactMajorSvg.children.filter(child =>
  child.tagName === "LINE" && child.attributes["data-string-label"]
);
assert(compactFretLines.every(line => ["6", "9"].includes(line.attributes["stroke-width"])), "compact fret lines are slightly quieter without becoming faint");
assert(compactStringLines.every(line => line.attributes["stroke-width"] === "2.25"), "compact string lines retain clear structure with slightly reduced dominance");
const compactMarkerLabels = compactMajorSvg.children.filter(child =>
  child.attributes["data-diagram-label"] === "marker"
);
assert.deepStrictEqual([...compactMarkerLabels.map(label => label.textContent)].sort(), ["3", "5", "R"], "compact major markers render R, 3, and 5");
assert(compactMarkerLabels.every(label => label.attributes["font-size"] === "23" && label.attributes["font-weight"] === "900"), "compact marker labels receive the strongest readable type treatment");
assert(compactMarkerCircles.every(circle => circle.attributes.r === "28"), "compact chord-tone marker diameter remains unchanged");
assert(compactMarkerCircles.every(circle => {
  const x = Number(circle.attributes.cx);
  const y = Number(circle.attributes.cy);
  const radius = Number(circle.attributes.r);
  return x - radius >= 0 && x + radius <= 460 && y - radius >= 0 && y + radius <= 500;
}), "compact markers remain inside the unchanged view box at every responsive scale");
const compactRootCircle = compactMarkerCircles.find(circle => circle.attributes["data-root"] === "true");
const compactRootLabel = compactMarkerLabels.find(label => label.attributes["data-root"] === "true");
assert.strictEqual(compactRootCircle.attributes.fill, "#165f48", "the existing distinct root color is preserved");
assert.strictEqual(compactRootLabel.textContent, "R", "the root remains identified by text as well as color");
assert(compactMajorSvg.attributes["aria-label"].includes("Strings low to high"), "compact SVG describes its string names accessibly");
assert(compactMajorSvg.attributes["aria-label"].includes("root"), "compact SVG describes the root location accessibly");

const compactMinorSvg = renderCompactFretboardForTest(aMinorDiagram);
const compactMinorLabels = compactMinorSvg.children.filter(child =>
  child.attributes["data-diagram-label"] === "marker"
);
const flatThirdLabel = compactMinorLabels.find(label => label.textContent === "♭3");
assert(flatThirdLabel, "compact minor diagrams preserve the flat-three symbol");
assert.strictEqual(flatThirdLabel.attributes["font-size"], "23", "the flat-three symbol uses the readable compact marker size");
assert.strictEqual(flatThirdLabel.attributes["text-anchor"], "middle", "the flat-three symbol remains centered in its marker");
assert(/\.fretboard-voice-compact-diagram \.fretboard-svg\s*\{[^}]*max-height:\s*205px/.test(html), "desktop compact diagram height remains 205 pixels");
assert(/@media \(max-width: 600px\)[\s\S]*\.fretboard-voice-compact-diagram \.fretboard-svg\s*\{[^}]*max-height:\s*175px/.test(html), "narrow compact diagram height remains 175 pixels");

midiApi.renderFretboardDiagram(cMajorRootDiagram, harness.elements.fretboardDiagram);
const fullSizeFretboardSvg = harness.elements.fretboardDiagram.children[0];
const fullStringLabel = fullSizeFretboardSvg.children.find(child => child.attributes["data-diagram-label"] === "string");
const fullMarkerLabel = fullSizeFretboardSvg.children.find(child => child.attributes["data-diagram-label"] === "marker");
const fullFretLines = fullSizeFretboardSvg.children.filter(child => child.tagName === "LINE" && child.attributes["data-fret-boundary"] !== undefined);
assert.strictEqual(fullStringLabel.attributes["font-size"], "20", "full-size diagram string typography remains unchanged");
assert.strictEqual(fullMarkerLabel.attributes["font-size"], "17", "full-size diagram marker typography remains unchanged");
assert(fullFretLines.every(line => ["8", "11"].includes(line.attributes["stroke-width"])), "full-size fretboard grid styling remains unchanged");

midiApi.resetFretboardPromptHistory();
const generatedFretboardExercises = [];
for (let index = 0; index < 72; index += 1) {
  midiApi.resetFretboardPromptHistory();
  generatedFretboardExercises.push(midiApi.generateFretboardExercise(
    cMajor,
    { stringSet: "Any", includeOpen: false, fretRange: "any", dotLabels: "chord-tones" },
    () => (index + 0.1) / 72
  ));
}
assert(generatedFretboardExercises.every(Boolean), "random fretboard exercise generation always finds a playable shape");
assert.deepStrictEqual(
  [...new Set(generatedFretboardExercises.map(exercise => exercise.inversion))],
  [0, 1, 2],
  "random fretboard generation covers every inversion"
);
assert.deepStrictEqual(
  [...new Set(generatedFretboardExercises.map(exercise => exercise.stringSet))].sort(),
  ["ADG", "DGB", "EAD", "GBE"],
  "Any randomizes across every enabled string set"
);
assert(generatedFretboardExercises.every(exercise => ["major", "minor"].includes(exercise.chord.quality)), "fretboard prompts exclude diminished and augmented chords");

const fretStatsStart = {
  completed: 0,
  totalRevealMs: 0,
  currentStreak: 0,
  longestStreak: 0,
  stringSets: {},
  keys: {}
};
const fretStatsOne = midiApi.updateFretboardStatistics(
  fretStatsStart,
  generatedFretboardExercises[0],
  1200
);
assert.strictEqual(fretStatsOne.completed, 1, "Reveal completes one fretboard exercise");
assert.strictEqual(fretStatsOne.totalRevealMs, 1200, "fretboard statistics record reveal time");
assert.strictEqual(fretStatsOne.currentStreak, 1, "fretboard statistics update current streak");
assert.strictEqual(fretStatsOne.longestStreak, 1, "fretboard statistics update longest streak");
assert.strictEqual(fretStatsOne.stringSets[generatedFretboardExercises[0].stringSet], 1, "favorite-string-set counts are tracked");
assert.strictEqual(fretStatsOne.keys["c-major"], 1, "most-practiced-key counts are tracked");

const fretboardStorage = new Map();
const fretboardSettingsHarness = createHarness({ mode: "fretboard" }, fretboardStorage);
fretboardSettingsHarness.elements.fretboardStringSet.value = "DGB";
fretboardSettingsHarness.elements.fretboardFretRange.value = "5-8";
fretboardSettingsHarness.elements.fretboardDotLabels.value = "both";
fretboardSettingsHarness.elements.fretboardIncludeOpen.checked = true;
fretboardSettingsHarness.elements.fretboardStringSet.dispatch("change");
fretboardSettingsHarness.elements.fretboardKeySelect.value = "e-flat-major";
fretboardSettingsHarness.elements.fretboardKeySelect.dispatch("change");
fretboardStorage.set("music-trainer-selected-mode", "fretboard");
const restoredFretboard = createHarness({}, fretboardStorage);
restoredFretboard.elements.homeFretboardButton.dispatch("click");
assert.strictEqual(restoredFretboard.elements.areaLandingScreen.hidden, false, "legacy Fretboard settings migrate without bypassing the new two-tool landing page");
restoredFretboard.elements.fretboardVoiceLeadingButton.dispatch("click");
assert.strictEqual(restoredFretboard.api.getSelectedMode(), "fretboard-voice", "saved Fretboard Practice mode migrates to Voice Leading");
assert.strictEqual(restoredFretboard.elements.fretboardVoiceStringSet.value, "DGB", "legacy Practice string set carries into Route");
assert.strictEqual(restoredFretboard.elements.fretboardVoiceFretRange.value, "5-8", "legacy Practice fret range carries into Route");
assert.strictEqual(restoredFretboard.elements.fretboardVoiceIncludeOpen.checked, true, "legacy Practice open-position setting carries into Route");

const keyStudyUi = createHarness({ mode: "key-study" });
keyStudyUi.elements.startButton.dispatch("click");
assert.strictEqual(keyStudyUi.elements.keyStudyScreen.hidden, false, "the old Key Study entry opens Shape Library");
assert.strictEqual(keyStudyUi.api.getSelectedMode(), "fretboard-voice", "the legacy Key Study mode redirects into Voice Leading");
assert.strictEqual(keyStudyUi.elements.fretboardScreen.hidden, true, "opening the reference does not start practice immediately");
assert.strictEqual(keyStudyUi.elements.keyStudyKeyContext.textContent, "Key: C major", "reference keeps the selected key visible");
assert.strictEqual(keyStudyUi.elements.keyStudyStringContext.textContent, "String set: G B E", "reference keeps the fixed string set visible");
assert.strictEqual(keyStudyUi.elements.keyStudyReference.children.length, 7, "Shape Library renders all seven supported diatonic chords by default");
assert.strictEqual(keyStudyUi.api.getCurrentKeyStudyReference().playableItems.length > 0, true, "reference contains playable diagrams");
const shapeDetailItem = keyStudyUi.api.getCurrentKeyStudyReference().playableItems[0];
shapeDetailItem.cardElement.children.at(-1).dispatch("click");
assert.strictEqual(keyStudyUi.elements.shapeLibraryDetail.hidden, false, "a compact Shape Library diagram opens full-size detail");
assert.strictEqual(keyStudyUi.elements.shapeLibraryDetailDiagram.children.length, 1, "Shape Library detail reuses the full-size diagram renderer");
assert.strictEqual(keyStudyUi.elements.shapeLibraryDetailTab.children.length, 1, "Shape Library detail includes matching TAB");
keyStudyUi.elements.shapeLibraryDetailClose.dispatch("click");
assert.strictEqual(keyStudyUi.elements.shapeLibraryDetail.hidden, true, "Shape Library detail closes without changing the reference");

keyStudyUi.elements.keyStudyPlayButton.dispatch("click");
const firstPlayThroughItem = keyStudyUi.api.getCurrentKeyStudyReference().playableItems[0];
assert.strictEqual(firstPlayThroughItem.cardElement.dataset.active, "true", "Play Through highlights exactly the first diagram");
keyStudyUi.elements.keyStudyNextButton.dispatch("click");
assert.strictEqual(firstPlayThroughItem.cardElement.dataset.active, "false", "Next clears the previous Play Through highlight");
assert.strictEqual(
  keyStudyUi.api.getCurrentKeyStudyReference().playableItems[1].cardElement.dataset.active,
  "true",
  "Next highlights the following diagram"
);
keyStudyUi.elements.keyStudyPreviousButton.dispatch("click");
assert.strictEqual(firstPlayThroughItem.cardElement.dataset.active, "true", "Previous moves the highlight backward");

keyStudyUi.elements.keyStudyAutoAdvance.checked = true;
keyStudyUi.elements.keyStudyAutoAdvance.dispatch("change");
keyStudyUi.advance(5000);
assert.strictEqual(
  keyStudyUi.api.getCurrentKeyStudyReference().playableItems[1].cardElement.dataset.active,
  "true",
  "optional Auto Advance moves the Play Through highlight after the selected delay"
);

keyStudyUi.elements.keyStudyDegreeI.checked = false;
keyStudyUi.elements.keyStudyDegreeIi.checked = false;
keyStudyUi.elements.keyStudyDegreeIii.checked = false;
keyStudyUi.elements.keyStudyDegreeIV.checked = true;
keyStudyUi.elements.keyStudyDegreeV.checked = false;
keyStudyUi.elements.keyStudyDegreeVi.checked = false;
keyStudyUi.elements.keyStudyDegreeVii.checked = false;
keyStudyUi.elements.keyStudyInversionRoot.checked = false;
keyStudyUi.elements.keyStudyInversionFirst.checked = false;
keyStudyUi.elements.keyStudyInversionSecond.checked = true;
keyStudyUi.elements.keyStudyStringSet.value = "DGB";
keyStudyUi.elements.keyStudyIncludeOpen.checked = true;
assert.strictEqual(keyStudyUi.elements.keyStudyPracticeButton.hidden, true, "the retired Fretboard Practice action is not visible in Shape Library");
assert.strictEqual(keyStudyUi.elements.fretboardScreen.hidden, true, "Shape Library never opens the retired Fretboard Practice screen");

const noInversionStudy = createHarness({ mode: "key-study" });
noInversionStudy.elements.keyStudyInversionRoot.checked = false;
noInversionStudy.elements.keyStudyInversionFirst.checked = false;
noInversionStudy.elements.keyStudyInversionSecond.checked = false;
noInversionStudy.elements.startButton.dispatch("click");
assert.strictEqual(noInversionStudy.elements.keyStudyReference.children.length, 1, "no inversions produces one clear empty-state panel");
assert.strictEqual(noInversionStudy.elements.keyStudyPracticeButton.disabled, true, "empty inversion selection cannot launch an invalid practice session");
assert.strictEqual(noInversionStudy.elements.keyStudyPlayButton.disabled, true, "empty inversion selection disables Play Through");

const keyStudyStorage = new Map();
const keyStudySaved = createHarness({ mode: "key-study" }, keyStudyStorage);
keyStudySaved.elements.keyStudyStringSet.value = "EAD";
keyStudySaved.elements.keyStudyFretRange.value = "5-8";
keyStudySaved.elements.keyStudyDotLabels.value = "both";
keyStudySaved.elements.keyStudyIncludeOpen.checked = true;
keyStudySaved.elements.keyStudyDegreeVii.checked = true;
keyStudySaved.elements.keyStudyStringSet.dispatch("change");
const restoredKeyStudy = createHarness({}, keyStudyStorage);
assert.strictEqual(restoredKeyStudy.api.getSelectedMode(), "fretboard-voice", "old Key Study mode migrates to Voice Leading");
assert.strictEqual(restoredKeyStudy.elements.keyStudyStringSet.value, "EAD", "Key Study string set persists");
assert.strictEqual(restoredKeyStudy.elements.keyStudyFretRange.value, "5-8", "Key Study fret range persists");
assert.strictEqual(restoredKeyStudy.elements.keyStudyDotLabels.value, "both", "Key Study marker labels persist");
assert.strictEqual(restoredKeyStudy.elements.keyStudyIncludeOpen.checked, true, "Key Study open-position setting persists");
assert.strictEqual(restoredKeyStudy.elements.keyStudyDegreeVii.checked, true, "Key Study degree toggles persist");
restoredKeyStudy.elements.homeFretboardButton.dispatch("click");
restoredKeyStudy.elements.fretboardVoiceLeadingButton.dispatch("click");
assert.strictEqual(restoredKeyStudy.elements.keyStudyScreen.hidden, false, "migrated Key Study state restores Shape Library");
assert.strictEqual(restoredKeyStudy.elements.shapeLibraryStringSet.value, "EAD", "migrated Key Study string set is available in Shape Library");

const fretboardVoiceUi = createHarness({ mode: "fretboard-voice" });
assert(!html.includes('id="fretboardVoiceCycleButton"'), "Fretboard Voice Leading no longer renders a Cycle view");
assert(!html.includes('id="fretboardVoicePreviousButton"'), "Fretboard Voice Leading no longer renders step-by-step Previous controls");
assert(!html.includes('id="fretboardVoiceNextButton"'), "Fretboard Voice Leading no longer renders step-by-step Next controls");
assert(!html.includes('id="fretboardVoiceCycleCounter"'), "Fretboard Voice Leading no longer renders cycle statistics");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceSettings.hidden, false, "Fretboard Voice Leading has its own setup inside the Fretboard area");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceStartingLocation.value, "auto", "Auto is the default starting-location mode");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceStartingShapePicker.hidden, true, "Auto keeps advanced exact-shape diagrams out of the normal setup flow");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceStartingMessage.className, "hint", "Auto does not show an exact-shape validation warning");
fretboardVoiceUi.elements.startButton.dispatch("click");
const selectedGuitarStart = fretboardVoiceUi.api.getFretboardVoiceSelectedFrets();
assert(selectedGuitarStart && selectedGuitarStart.length === 3, "Auto chooses a valid three-fret starting anchor without manual selection");
const stableGuitarRoute = fretboardVoiceUi.api.getCurrentFretboardVoiceRoute();
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceScreen.hidden, false, "Generate Route opens the compact guitar route screen");
assert(stableGuitarRoute.route.length >= 6, "the default ascending progression produces a complete route");
assert.deepStrictEqual([...stableGuitarRoute.route[0].frets], [...selectedGuitarStart], "the generated route begins on the automatically selected shape");
assert.strictEqual(stableGuitarRoute.route[0].romanNumeral, "I", "Auto respects the selected starting chord");
assert.strictEqual(stableGuitarRoute.route[0].inversionIndex, 1, "Auto respects the selected starting inversion");
assert.strictEqual(stableGuitarRoute.route[0].stringSet, "GBE", "Auto respects the selected string set");
assert(stableGuitarRoute.route[0].frets.every(fret => fret > 0), "Any excludes open shapes when Include Open Positions is off");
assert.strictEqual(stableGuitarRoute.startingSelection, "auto", "the route records its automatic starting-shape choice");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceRoute.children.length, stableGuitarRoute.route.length, "one compact diagram card is rendered for every route step");
assert(fretboardVoiceUi.elements.fretboardVoiceRouteSummary.textContent.includes("C major · GBE"), "the route header keeps key and string-set context concise");
assert(fretboardVoiceUi.elements.fretboardVoiceRouteSummary.textContent.includes("Selected automatically"), "the route summary identifies an automatic starting shape");
assert(fretboardVoiceUi.elements.fretboardVoiceRouteSummary.textContent.includes(`Frets ${selectedGuitarStart.join("–")}`), "the route summary shows the selected starting frets");
fretboardVoiceUi.elements.fretboardVoiceScreenLibraryButton.dispatch("click");
assert.strictEqual(fretboardVoiceUi.elements.keyStudyScreen.hidden, false, "a generated route can open Shape Library directly");
assert.strictEqual(fretboardVoiceUi.api.getCurrentFretboardVoiceRoute(), stableGuitarRoute, "opening Shape Library does not regenerate or replace the route");
fretboardVoiceUi.elements.shapeLibraryRouteButton.dispatch("click");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceScreen.hidden, false, "Route returns to the generated route when its settings still match");
assert.strictEqual(fretboardVoiceUi.api.getCurrentFretboardVoiceRoute(), stableGuitarRoute, "returning from Shape Library preserves the same generated route object");
assert.strictEqual(fretboardVoiceUi.api.getFretboardVoiceMode(), "study", "Study is the default Fretboard Voice Leading view");
assert(fretboardVoiceUi.elements.fretboardVoiceRoute.children.every(card => card.children.length >= 3), "Study keeps every compact diagram visible at once");
assert(!studyDescendants(fretboardVoiceUi.elements.fretboardVoiceRoute).some(element => element.tagName === "BUTTON" && element.className === "triad-shape-marker-button"), "Voice Leading diagrams remain noninteractive when the shared renderer's Quiz mode is not requested");
assert(fretboardVoiceUi.elements.fretboardVoiceRoute.children.every(card => card.dataset.active === undefined), "Study does not track a current route step");
assert.strictEqual(
  fretboardVoiceUi.elements.fretboardVoiceViewDescription.textContent,
  "See the complete voice-led route and play through it freely.",
  "Study explains that the route can be played freely"
);
fretboardVoiceUi.api.setFretboardVoiceMode("cycle");
assert.strictEqual(fretboardVoiceUi.api.getFretboardVoiceMode(), "study", "the removed Cycle value is no longer accepted");

fretboardVoiceUi.elements.fretboardVoiceRecallButton.dispatch("click");
assert.strictEqual(fretboardVoiceUi.api.getFretboardVoiceMode(), "recall", "Recall mode activates without a new route");
assert(fretboardVoiceUi.elements.fretboardVoiceRoute.children.every(card => card.children.length === 2), "Recall hides diagrams and exact frets while retaining chord labels");
fretboardVoiceUi.elements.fretboardVoiceRevealRouteButton.dispatch("click");
assert(fretboardVoiceUi.elements.fretboardVoiceRoute.children.every(card => card.children.length >= 3), "Reveal Diagrams restores the existing route diagrams");
assert.strictEqual(fretboardVoiceUi.api.getCurrentFretboardVoiceRoute(), stableGuitarRoute, "Reveal Diagrams does not regenerate the route");
fretboardVoiceUi.elements.fretboardVoiceStudyButton.dispatch("click");
assert.strictEqual(fretboardVoiceUi.api.getFretboardVoiceMode(), "study", "Study remains available after Recall");
assert.strictEqual(fretboardVoiceUi.api.getCurrentFretboardVoiceRoute(), stableGuitarRoute, "switching between Recall and Study preserves the generated route");
assert(fretboardVoiceUi.elements.fretboardVoiceRoute.children.every(card => card.children.length >= 3), "returning to Study restores the complete visible route");
fretboardVoiceUi.elements.fretboardVoiceRoute.children[0].dispatch("click");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceDetail.hidden, false, "a compact diagram opens the full detail view");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceDetailDiagram.children.length, 1, "detail view reuses the full fretboard diagram renderer");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceDetailTab.children.length, 1, "detail view includes TAB from the same route-step data");
fretboardVoiceUi.elements.fretboardVoiceDetailClose.dispatch("click");
assert.strictEqual(fretboardVoiceUi.elements.fretboardVoiceDetail.hidden, true, "closing detail returns to the unchanged route");
assert(!html.includes('id="fretboardVoicePreserveStart"'), "the generated route no longer renders Preserve starting shape");
assert(!html.includes('id="fretboardVoiceChangeStartButton"'), "the generated route no longer renders Change Starting Shape");
assert(!html.includes('id="fretboardVoiceRecalculateButton"'), "the generated route no longer renders Recalculate Route");
const routeFooterMarkup = html.match(/<footer class="fretboard-voice-footer">([\s\S]*?)<\/footer>/)?.[1] || "";
assert.strictEqual((routeFooterMarkup.match(/<button\b/g) || []).length, 1, "the generated route footer contains one action without empty control spacing");
assert(routeFooterMarkup.includes('id="fretboardVoiceSettingsButton"') && routeFooterMarkup.includes("Back to Settings"), "Back to Settings is the sole route-footer action");

const exactStartUi = createHarness({ mode: "fretboard-voice" });
exactStartUi.elements.setupScreen.hidden = false;
exactStartUi.elements.fretboardVoiceStartingLocation.value = "exact";
exactStartUi.elements.fretboardVoiceStartingLocation.dispatch("change");
assert.strictEqual(exactStartUi.elements.fretboardVoiceStartingMessage.className, "hint", "Choose Exact Shape does not show a warning before Generate Route is pressed");
exactStartUi.elements.startButton.dispatch("click");
assert.strictEqual(exactStartUi.elements.setupScreen.hidden, false, "Choose Exact Shape waits on the setup screen when no diagram is selected");
assert.strictEqual(exactStartUi.elements.fretboardVoiceStartingMessage.textContent, "Choose a starting shape to continue.", "manual validation appears only when necessary");
assert.strictEqual(exactStartUi.elements.fretboardVoiceStartingMessage.className, "hint error", "the manual validation message is visibly actionable");
exactStartUi.elements.fretboardVoiceStartingShapes.children[0].dispatch("click");
const exactStartFrets = exactStartUi.api.getFretboardVoiceSelectedFrets();
exactStartUi.elements.startButton.dispatch("click");
assert.deepStrictEqual([...exactStartUi.api.getCurrentFretboardVoiceRoute().route[0].frets], [...exactStartFrets], "Choose Exact Shape preserves the existing manual anchoring workflow");
assert.strictEqual(exactStartUi.api.getCurrentFretboardVoiceRoute().startingSelection, "exact", "manual routes retain their exact-selection identity");
const firstExactRoute = exactStartUi.api.getCurrentFretboardVoiceRoute();
exactStartUi.elements.fretboardVoiceSettingsButton.dispatch("click");
assert.strictEqual(exactStartUi.elements.fretboardVoiceStartingLocation.value, "exact", "Back to Settings preserves a deliberately selected compatible exact mode");
assert.deepStrictEqual([...exactStartUi.api.getFretboardVoiceSelectedFrets()], [...exactStartFrets], "Back to Settings preserves the compatible deliberate exact shape");
exactStartUi.elements.startButton.dispatch("click");
assert.notStrictEqual(exactStartUi.api.getCurrentFretboardVoiceRoute(), firstExactRoute, "Generate Route creates a fresh exact route from Settings without result-screen recalculation");
assert.deepStrictEqual([...exactStartUi.api.getCurrentFretboardVoiceRoute().route[0].frets], [...exactStartFrets], "fresh exact route generation retains the explicitly selected physical shape");

const invalidExactUi = createHarness({ mode: "fretboard-voice" });
invalidExactUi.elements.setupScreen.hidden = false;
invalidExactUi.elements.fretboardVoiceStartingInversion.value = "0";
invalidExactUi.elements.fretboardVoiceMaxSpan.value = "2";
invalidExactUi.elements.fretboardVoiceIncludeOpen.checked = true;
invalidExactUi.elements.fretboardVoiceStartingLocation.value = "exact";
invalidExactUi.elements.fretboardVoiceStartingLocation.dispatch("change");
invalidExactUi.api.renderFretboardVoiceStartingShapes();
assert(invalidExactUi.elements.fretboardVoiceStartingShapes.children.length, "the exact-mode invalidation fixture begins with a selectable root-position shape");
invalidExactUi.elements.fretboardVoiceStartingShapes.children[0].dispatch("click");
invalidExactUi.elements.fretboardVoiceFretRange.value = "0-4";
invalidExactUi.elements.fretboardVoiceFretRange.dispatch("change");
assert.strictEqual(invalidExactUi.elements.fretboardVoiceStartingLocation.value, "auto", "an incompatible exact shape automatically returns Starting Location to Auto");
assert.strictEqual(invalidExactUi.api.getFretboardVoiceSelectedFrets(), null, "an exact shape that violates new fret settings is cleared safely");
assert.strictEqual(invalidExactUi.elements.fretboardVoiceStartingShapePicker.hidden, true, "automatic recovery hides the exact-shape cards and validation");
assert(invalidExactUi.elements.fretboardVoiceRouteNotice.textContent.includes("Starting Location returned to Auto"), "automatic recovery briefly explains why exact mode ended");
assert.strictEqual(invalidExactUi.elements.fretboardVoiceRouteNotice.className, "hint", "exact-shape recovery uses informational styling");
invalidExactUi.elements.startButton.dispatch("click");
assert.strictEqual(invalidExactUi.elements.fretboardVoiceScreen.hidden, false, "one normal Generate Route click continues immediately after exact-shape recovery");
assert(invalidExactUi.api.getCurrentFretboardVoiceRoute().route.length, "Auto finds a replacement inversion, physical shape, and complete route");

const staleRouteUi = createHarness({ mode: "fretboard-voice" });
staleRouteUi.elements.startButton.dispatch("click");
const routeBeforeLibraryChange = staleRouteUi.api.getCurrentFretboardVoiceRoute();
staleRouteUi.elements.fretboardVoiceScreenLibraryButton.dispatch("click");
staleRouteUi.elements.shapeLibraryStringSet.value = "DGB";
staleRouteUi.elements.shapeLibraryStringSet.dispatch("change");
assert.strictEqual(staleRouteUi.api.getCurrentFretboardVoiceRoute(), null, "an incompatible generated route is cleared automatically");
assert.notStrictEqual(staleRouteUi.api.getCurrentFretboardVoiceRoute(), routeBeforeLibraryChange, "the obsolete route is not retained internally");
assert.strictEqual(staleRouteUi.elements.fretboardVoiceStartingLocation.value, "auto", "ordinary Shape Library setting changes preserve Auto mode");
staleRouteUi.elements.shapeLibraryRouteButton.dispatch("click");
assert.strictEqual(staleRouteUi.elements.setupScreen.hidden, false, "returning to Route opens the ready-to-generate setup");
assert(staleRouteUi.elements.fretboardVoiceRouteNotice.textContent.includes("Route settings updated for DGB"), "a concise informational notice replaces the blocking stale-route warning");
assert.strictEqual(staleRouteUi.elements.fretboardVoiceRouteNotice.className, "hint", "normal route recovery never uses red error styling");
assert.strictEqual(staleRouteUi.elements.fretboardVoiceStringSet.value, "DGB", "the new shared string-set selection is preserved");
staleRouteUi.elements.startButton.dispatch("click");
assert.strictEqual(staleRouteUi.api.getCurrentFretboardVoiceRoute().stringSet, "DGB", "the normal Generate Route action immediately builds a route for the recovered string set");

const ordinarySettingsUi = createHarness({ mode: "fretboard-voice" });
ordinarySettingsUi.elements.fretboardVoiceKeySelect.value = "g-major";
ordinarySettingsUi.elements.fretboardVoiceStringSet.value = "DGB";
ordinarySettingsUi.elements.fretboardVoiceStartingChord.value = "I";
ordinarySettingsUi.elements.fretboardVoiceStartingInversion.value = "1";
ordinarySettingsUi.elements.fretboardVoiceFretRange.value = "any";
ordinarySettingsUi.elements.fretboardVoiceStartingLocation.value = "auto";
ordinarySettingsUi.elements.fretboardVoiceProgressionSource.value = "common";
ordinarySettingsUi.elements.fretboardVoiceCommonProgression.value = "I-IV-V-I";
ordinarySettingsUi.elements.fretboardVoiceFinalTonic.checked = false;
ordinarySettingsUi.elements.fretboardVoiceIncludeOpen.checked = true;
ordinarySettingsUi.elements.startButton.dispatch("click");
const firstRouteFromSettings = ordinarySettingsUi.api.getCurrentFretboardVoiceRoute();
const preservedRouteSettings = {
  key: ordinarySettingsUi.elements.fretboardVoiceKeySelect.value,
  stringSet: ordinarySettingsUi.elements.fretboardVoiceStringSet.value,
  chord: ordinarySettingsUi.elements.fretboardVoiceStartingChord.value,
  inversion: ordinarySettingsUi.elements.fretboardVoiceStartingInversion.value,
  fretRange: ordinarySettingsUi.elements.fretboardVoiceFretRange.value,
  startingLocation: ordinarySettingsUi.elements.fretboardVoiceStartingLocation.value,
  progression: ordinarySettingsUi.elements.fretboardVoiceProgressionSource.value,
  commonProgression: ordinarySettingsUi.elements.fretboardVoiceCommonProgression.value,
  finalTonic: ordinarySettingsUi.elements.fretboardVoiceFinalTonic.checked,
  includeOpen: ordinarySettingsUi.elements.fretboardVoiceIncludeOpen.checked
};
ordinarySettingsUi.elements.fretboardVoiceSettingsButton.dispatch("click");
assert.strictEqual(ordinarySettingsUi.elements.setupScreen.hidden, false, "Back to Settings returns directly to Route settings");
assert.strictEqual(ordinarySettingsUi.getActiveElement(), ordinarySettingsUi.elements.title, "Back to Settings moves keyboard focus to the settings heading");
assert.deepStrictEqual({
  key: ordinarySettingsUi.elements.fretboardVoiceKeySelect.value,
  stringSet: ordinarySettingsUi.elements.fretboardVoiceStringSet.value,
  chord: ordinarySettingsUi.elements.fretboardVoiceStartingChord.value,
  inversion: ordinarySettingsUi.elements.fretboardVoiceStartingInversion.value,
  fretRange: ordinarySettingsUi.elements.fretboardVoiceFretRange.value,
  startingLocation: ordinarySettingsUi.elements.fretboardVoiceStartingLocation.value,
  progression: ordinarySettingsUi.elements.fretboardVoiceProgressionSource.value,
  commonProgression: ordinarySettingsUi.elements.fretboardVoiceCommonProgression.value,
  finalTonic: ordinarySettingsUi.elements.fretboardVoiceFinalTonic.checked,
  includeOpen: ordinarySettingsUi.elements.fretboardVoiceIncludeOpen.checked
}, preservedRouteSettings, "Back to Settings preserves every musical and fretboard choice");
assert.strictEqual(ordinarySettingsUi.elements.fretboardVoiceStartingLocation.value, "auto", "the normal workflow returns to Settings in Auto mode");
assert.strictEqual(ordinarySettingsUi.elements.fretboardVoiceStartingShapePicker.hidden, true, "Back to Settings does not expose exact-shape cards during the Auto workflow");
const savedRouteSettings = JSON.parse(
  ordinarySettingsUi.storage.get("fretboard-voice-leading-settings")
);
assert.strictEqual(savedRouteSettings.preserveStartingShape, undefined, "removed starting-shape preservation state is not persisted");
assert.strictEqual(savedRouteSettings.preserveStart, undefined, "removed recalculation state is absent from saved settings");
ordinarySettingsUi.elements.startButton.dispatch("click");
const secondRouteFromSettings = ordinarySettingsUi.api.getCurrentFretboardVoiceRoute();
assert.notStrictEqual(secondRouteFromSettings, firstRouteFromSettings, "generating again from Settings creates a fresh route result");
assert.strictEqual(ordinarySettingsUi.elements.fretboardVoiceRoute.children.length, secondRouteFromSettings.route.length, "fresh generation keeps every route diagram visible for practice");
ordinarySettingsUi.elements.fretboardVoiceSettingsButton.dispatch("click");
const ordinaryChanges = [
  [ordinarySettingsUi.elements.fretboardVoiceKeySelect, () => {
    ordinarySettingsUi.elements.fretboardVoiceKeySelect.value = "g-major";
  }, "changing the key"],
  [ordinarySettingsUi.elements.fretboardVoiceStringSet, () => {
    ordinarySettingsUi.elements.fretboardVoiceStringSet.value = "DGB";
  }, "changing the string set"],
  [ordinarySettingsUi.elements.fretboardVoiceStartingChord, () => {
    ordinarySettingsUi.elements.fretboardVoiceStartingChord.value = "IV";
  }, "changing the starting chord"],
  [ordinarySettingsUi.elements.fretboardVoiceStartingInversion, () => {
    ordinarySettingsUi.elements.fretboardVoiceStartingInversion.value = "0";
  }, "changing the inversion"],
  [ordinarySettingsUi.elements.fretboardVoiceFretRange, () => {
    ordinarySettingsUi.elements.fretboardVoiceFretRange.value = "5-8";
  }, "changing the fret range"],
  [ordinarySettingsUi.elements.fretboardVoiceIncludeOpen, () => {
    ordinarySettingsUi.elements.fretboardVoiceIncludeOpen.checked = true;
  }, "changing the open-position setting"],
  [ordinarySettingsUi.elements.fretboardVoiceProgressionSource, () => {
    ordinarySettingsUi.elements.fretboardVoiceProgressionSource.value = "descending";
  }, "changing the progression"],
  [ordinarySettingsUi.elements.fretboardVoiceFinalTonic, () => {
    ordinarySettingsUi.elements.fretboardVoiceFinalTonic.checked = false;
  }, "changing End on I"]
];
ordinaryChanges.forEach(([input, applyChange, description]) => {
  applyChange();
  input.dispatch("change");
  assert.strictEqual(ordinarySettingsUi.elements.fretboardVoiceStartingLocation.value, "auto", `${description} does not enter exact-shape mode`);
  assert.strictEqual(ordinarySettingsUi.elements.fretboardVoiceStartingShapePicker.hidden, true, `${description} keeps exact-shape cards hidden`);
  assert.notStrictEqual(ordinarySettingsUi.elements.fretboardVoiceRouteNotice.className, "hint error", `${description} does not produce a red saved-route warning`);
});
assert.strictEqual(ordinarySettingsUi.api.getCurrentFretboardVoiceRoute(), null, "ordinary setting changes leave no incompatible route behind");
assert(!html.includes("The saved route no longer matches"), "the old blocking saved-route mismatch copy has been removed");

const deterministicAutoUi = createHarness({ mode: "fretboard-voice" });
deterministicAutoUi.elements.startButton.dispatch("click");
assert.deepStrictEqual(
  [...deterministicAutoUi.api.getFretboardVoiceSelectedFrets()],
  [...selectedGuitarStart],
  "Any uses a deterministic practical starting shape for identical settings"
);
assert.strictEqual(deterministicAutoUi.api.getCurrentFretboardVoiceRoute().optimization, "whole-progression", "Auto selection uses the whole-route optimizer");

function configureFallbackUi(ui, {
  degree,
  requestedInversion,
  fretRange = "0-4",
  includeOpen = true,
  maxSpan = 2,
  includeFinalTonic = true
}) {
  ui.elements.fretboardVoiceStringSet.value = "GBE";
  ui.elements.fretboardVoiceStartingChord.value = degree;
  ui.elements.fretboardVoiceStartingInversion.value = String(requestedInversion);
  ui.elements.fretboardVoiceFretRange.value = fretRange;
  ui.elements.fretboardVoiceIncludeOpen.checked = includeOpen;
  ui.elements.fretboardVoiceMaxSpan.value = String(maxSpan);
  ui.elements.fretboardVoiceFinalTonic.checked = includeFinalTonic;
  ui.api.renderFretboardVoiceStartingShapes();
  return ui;
}

const rootToFirstUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "iii", requestedInversion: 0 }
);
assert.strictEqual(rootToFirstUi.api.fretboardVoiceStartingCandidates().length, 0, "the root-to-first fallback fixture has no root-position shape");
rootToFirstUi.elements.startButton.dispatch("click");
assert.strictEqual(rootToFirstUi.elements.fretboardVoiceStartingInversion.value, "1", "an unavailable root position changes to first inversion when first inversion is best");
assert(rootToFirstUi.api.getCurrentFretboardVoiceRoute().route.length, "root-to-first fallback generates a complete route instead of blocking");

const rootToSecondUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "I", requestedInversion: 0 }
);
rootToSecondUi.elements.startButton.dispatch("click");
assert.strictEqual(rootToSecondUi.elements.fretboardVoiceStartingInversion.value, "2", "an unavailable root position changes to second inversion when second inversion is the viable choice");
assert.strictEqual(rootToSecondUi.api.getCurrentFretboardVoiceRoute().automaticInversionFallback, true, "the generated route records its automatic inversion substitution");
assert(rootToSecondUi.elements.fretboardVoiceAutoMessage.textContent.includes("Root position was unavailable"), "Auto briefly explains the unavailable requested inversion");
assert(rootToSecondUi.elements.fretboardVoiceAutoMessage.textContent.includes("Second inversion was selected automatically"), "Auto identifies the inversion it selected");
assert.strictEqual(rootToSecondUi.elements.fretboardVoiceAutoMessage.className, "hint", "the automatic substitution notice does not use error styling");
assert.strictEqual(rootToSecondUi.elements.fretboardVoiceAutomaticInversionNotice.hidden, false, "the automatic substitution notice remains visible with the generated route");
assert.strictEqual(rootToSecondUi.elements.fretboardVoiceAutomaticInversionNoticeText.textContent, rootToSecondUi.api.getCurrentFretboardVoiceRoute().inversionFallbackNotice, "the route notice matches the substitution that occurred");
assert.strictEqual(JSON.parse(rootToSecondUi.storage.get("fretboard-voice-leading-settings")).startingInversion, 2, "the automatically selected inversion is saved as the visible current value");
const restoredFallbackUi = createHarness({ mode: "fretboard-voice" }, rootToSecondUi.storage);
assert.strictEqual(restoredFallbackUi.elements.fretboardVoiceStartingInversion.value, "2", "the automatically selected inversion remains current in the next session");
rootToSecondUi.elements.fretboardVoiceAutomaticInversionDismiss.dispatch("click");
assert.strictEqual(rootToSecondUi.elements.fretboardVoiceAutomaticInversionNotice.hidden, true, "the user can dismiss the automatic substitution notice");

const firstFallbackUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "I", requestedInversion: 1 }
);
firstFallbackUi.elements.startButton.dispatch("click");
assert.strictEqual(firstFallbackUi.elements.fretboardVoiceStartingInversion.value, "2", "an unavailable first inversion falls back correctly");

const secondFallbackUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "iii", requestedInversion: 2 }
);
secondFallbackUi.elements.startButton.dispatch("click");
assert.strictEqual(secondFallbackUi.elements.fretboardVoiceStartingInversion.value, "1", "an unavailable second inversion falls back correctly");

const validInversionUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "I", requestedInversion: 2 }
);
validInversionUi.elements.startButton.dispatch("click");
assert.strictEqual(validInversionUi.elements.fretboardVoiceStartingInversion.value, "2", "a valid selected inversion remains unchanged");
assert.strictEqual(validInversionUi.api.getCurrentFretboardVoiceRoute().automaticInversionFallback, false, "a valid selected inversion is not labeled as an automatic substitution");

const routeAwareFallbackUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "IV", requestedInversion: 0, fretRange: "any", includeOpen: false, maxSpan: 1 }
);
routeAwareFallbackUi.elements.fretboardVoiceStartingInversion.value = "1";
assert(routeAwareFallbackUi.api.fretboardVoiceStartingCandidates().length, "the route-aware fixture has first-inversion candidates");
routeAwareFallbackUi.api.renderFretboardVoiceStartingShapes();
const firstInversionRouteCost = routeAwareFallbackUi.api.calculateFretboardVoiceRoute(false).cost;
routeAwareFallbackUi.elements.fretboardVoiceStartingInversion.value = "2";
routeAwareFallbackUi.api.renderFretboardVoiceStartingShapes();
const secondInversionRouteCost = routeAwareFallbackUi.api.calculateFretboardVoiceRoute(false).cost;
assert(secondInversionRouteCost.totalMovement < firstInversionRouteCost.totalMovement, "the second-inversion option has the smoother complete route in the route-aware fixture");
routeAwareFallbackUi.elements.fretboardVoiceStartingInversion.value = "0";
routeAwareFallbackUi.api.renderFretboardVoiceStartingShapes();
routeAwareFallbackUi.elements.startButton.dispatch("click");
assert.strictEqual(routeAwareFallbackUi.elements.fretboardVoiceStartingInversion.value, "2", "fallback ranks complete routes across every valid alternate inversion instead of defaulting blindly");

const deterministicFallbackUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "IV", requestedInversion: 0, fretRange: "any", includeOpen: false, maxSpan: 1 }
);
deterministicFallbackUi.elements.startButton.dispatch("click");
assert.strictEqual(deterministicFallbackUi.elements.fretboardVoiceStartingInversion.value, routeAwareFallbackUi.elements.fretboardVoiceStartingInversion.value, "identical fallback settings choose the same inversion deterministically");
assert.deepStrictEqual([...deterministicFallbackUi.api.getFretboardVoiceSelectedFrets()], [...routeAwareFallbackUi.api.getFretboardVoiceSelectedFrets()], "identical fallback settings choose the same physical starting shape deterministically");

const endOnTonicUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "vi", requestedInversion: 0, fretRange: "any", includeOpen: false, maxSpan: 2, includeFinalTonic: true }
);
endOnTonicUi.elements.startButton.dispatch("click");
const noFinalTonicUi = configureFallbackUi(
  createHarness({ mode: "fretboard-voice" }),
  { degree: "vi", requestedInversion: 0, fretRange: "any", includeOpen: false, maxSpan: 2, includeFinalTonic: false }
);
noFinalTonicUi.elements.startButton.dispatch("click");
assert.strictEqual(endOnTonicUi.api.getCurrentFretboardVoiceRoute().degrees.at(-1), "I", "End on I is included in route-aware inversion scoring");
assert.strictEqual(noFinalTonicUi.api.getCurrentFretboardVoiceRoute().degrees.at(-1), "vi", "disabling End on I removes the closing tonic from route scoring");
assert.notStrictEqual(endOnTonicUi.elements.fretboardVoiceStartingInversion.value, noFinalTonicUi.elements.fretboardVoiceStartingInversion.value, "the route-aware fallback responds when End on I changes the best complete route");

const rangedAutoUi = createHarness({ mode: "fretboard-voice" });
rangedAutoUi.elements.fretboardVoiceFretRange.value = "5-8";
rangedAutoUi.elements.fretboardVoiceRangeBehavior.value = "prefer";
let rangedAutoSettings = null;
for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
  for (const degree of ["I", "ii", "iii", "IV", "V", "vi"]) {
    for (const inversion of [0, 1, 2]) {
      rangedAutoUi.elements.fretboardVoiceStringSet.value = stringSet;
      rangedAutoUi.elements.fretboardVoiceStartingChord.value = degree;
      rangedAutoUi.elements.fretboardVoiceStartingInversion.value = String(inversion);
      if (rangedAutoUi.api.fretboardVoiceStartingCandidates().length) {
        rangedAutoSettings = { stringSet, degree, inversion };
        break;
      }
    }
    if (rangedAutoSettings) break;
  }
  if (rangedAutoSettings) break;
}
assert(rangedAutoSettings, "at least one configured triad has a playable 5–8 starting shape");
rangedAutoUi.api.renderFretboardVoiceStartingShapes();
rangedAutoUi.elements.startButton.dispatch("click");
const rangedAutoStart = rangedAutoUi.api.getCurrentFretboardVoiceRoute().route[0];
assert(rangedAutoStart.frets.every(fret => fret >= 5 && fret <= 8), "Auto keeps the starting shape inside the selected 5–8 fret range");
assert.strictEqual(rangedAutoStart.romanNumeral, rangedAutoSettings.degree, "range-aware Auto does not silently substitute another chord");
assert.strictEqual(rangedAutoStart.inversionIndex, rangedAutoSettings.inversion, "range-aware Auto does not silently substitute another inversion");
assert.strictEqual(rangedAutoStart.stringSet, rangedAutoSettings.stringSet, "range-aware Auto preserves the selected string set");

for (const [rangeId, minimum, maximum] of [["0-4", 0, 4], ["9-12", 9, 12]]) {
  const rangeUi = createHarness({ mode: "fretboard-voice" });
  rangeUi.elements.fretboardVoiceFretRange.value = rangeId;
  rangeUi.elements.fretboardVoiceRangeBehavior.value = "prefer";
  let found = false;
  for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
    for (const degree of ["I", "ii", "iii", "IV", "V", "vi"]) {
      for (const inversion of [0, 1, 2]) {
        rangeUi.elements.fretboardVoiceStringSet.value = stringSet;
        rangeUi.elements.fretboardVoiceStartingChord.value = degree;
        rangeUi.elements.fretboardVoiceStartingInversion.value = String(inversion);
        if (rangeUi.api.fretboardVoiceStartingCandidates().length) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }
  assert(found, `${rangeId} contains at least one supported starting shape`);
  rangeUi.api.renderFretboardVoiceStartingShapes();
  rangeUi.elements.startButton.dispatch("click");
  assert(
    rangeUi.api.getCurrentFretboardVoiceRoute().route[0].frets.every(fret =>
      fret >= minimum && fret <= maximum
    ),
    `Auto keeps the starting shape inside the selected ${rangeId} fret range`
  );
}

const openCandidateUi = createHarness({ mode: "fretboard-voice" });
let openCandidateSettings = null;
for (const stringSet of ["GBE", "DGB", "ADG", "EAD"]) {
  for (const degree of ["I", "ii", "iii", "IV", "V", "vi"]) {
    for (const inversion of [0, 1, 2]) {
      openCandidateUi.elements.fretboardVoiceStringSet.value = stringSet;
      openCandidateUi.elements.fretboardVoiceStartingChord.value = degree;
      openCandidateUi.elements.fretboardVoiceStartingInversion.value = String(inversion);
      openCandidateUi.elements.fretboardVoiceFretRange.value = "0-4";
      openCandidateUi.elements.fretboardVoiceIncludeOpen.checked = true;
      if (openCandidateUi.api.fretboardVoiceStartingCandidates().some(candidate =>
        candidate.voicing.frets.includes(0)
      )) {
        openCandidateSettings = { stringSet, degree, inversion };
        break;
      }
    }
    if (openCandidateSettings) break;
  }
  if (openCandidateSettings) break;
}
assert(openCandidateSettings, "the supported chord set contains an open-position starting option");
openCandidateUi.elements.fretboardVoiceStringSet.value = openCandidateSettings.stringSet;
openCandidateUi.elements.fretboardVoiceStartingChord.value = openCandidateSettings.degree;
openCandidateUi.elements.fretboardVoiceStartingInversion.value = String(openCandidateSettings.inversion);
openCandidateUi.elements.fretboardVoiceFretRange.value = "0-4";
openCandidateUi.elements.fretboardVoiceIncludeOpen.checked = false;
assert(openCandidateUi.api.fretboardVoiceStartingCandidates().every(candidate =>
  !candidate.voicing.frets.includes(0)
), "Auto excludes open-position candidates when Include Open Positions is off");
openCandidateUi.elements.fretboardVoiceIncludeOpen.checked = true;
assert(openCandidateUi.api.fretboardVoiceStartingCandidates().some(candidate =>
  candidate.voicing.frets.includes(0)
), "Auto considers open-position candidates when Include Open Positions is on");

const noAutoShapeUi = createHarness({ mode: "fretboard-voice" });
noAutoShapeUi.elements.setupScreen.hidden = false;
noAutoShapeUi.elements.fretboardVoiceFretRange.value = "0-4";
noAutoShapeUi.elements.fretboardVoiceMaxSpan.value = "1";
noAutoShapeUi.elements.fretboardVoiceIncludeOpen.checked = false;
noAutoShapeUi.api.renderFretboardVoiceStartingShapes();
assert.strictEqual(noAutoShapeUi.api.fretboardVoiceStartingCandidates().length, 0, "the empty-state test uses settings with no valid starting shape");
noAutoShapeUi.elements.startButton.dispatch("click");
assert.strictEqual(noAutoShapeUi.elements.setupScreen.hidden, false, "Auto remains in setup when no valid shape exists");
assert(noAutoShapeUi.elements.fretboardVoiceAutoMessage.textContent.includes("No C major triad shape is available on GBE"), "Auto names the chord and string set when every inversion is unavailable");
assert(noAutoShapeUi.elements.fretboardVoiceAutoMessage.textContent.includes("within frets 0–4"), "the all-inversions empty state names the active fret restriction");
assert(noAutoShapeUi.elements.fretboardVoiceAutoMessage.textContent.includes("open positions are excluded"), "the all-inversions empty state names the open-position restriction");
assert.strictEqual(noAutoShapeUi.elements.fretboardVoiceAutoMessage.className, "hint error", "only the genuinely blocking all-inversions empty state uses error styling");

const customGuitarUi = createHarness({ mode: "fretboard-voice" });
customGuitarUi.elements.fretboardVoiceProgressionSource.value = "custom";
customGuitarUi.elements.fretboardVoiceProgressionSource.dispatch("change");
const originalCustomLength = customGuitarUi.api.getFretboardVoiceCustomDegrees().length;
customGuitarUi.elements.fretboardVoiceAddChord.value = "I";
customGuitarUi.elements.fretboardVoiceAddButton.dispatch("click");
assert.strictEqual(customGuitarUi.api.getFretboardVoiceCustomDegrees().length, originalCustomLength + 1, "Custom progressions can add and repeat chords");
const finalCustomRow = customGuitarUi.elements.fretboardVoiceCustomSequence.children.at(-1);
finalCustomRow.children[1].children[0].dispatch("click");
assert.strictEqual(customGuitarUi.api.getFretboardVoiceCustomDegrees().at(-2), "I", "Custom progressions can reorder chords");
customGuitarUi.elements.fretboardVoiceClearButton.dispatch("click");
assert.strictEqual(customGuitarUi.api.getFretboardVoiceCustomDegrees().length, 0, "Custom progressions can be cleared");

const handoffUi = createHarness({ mode: "key-study" });
handoffUi.elements.keyStudyKeySelect.value = "g-major";
handoffUi.elements.keyStudyKeySelect.dispatch("change");
handoffUi.elements.keyStudyStringSet.value = "DGB";
handoffUi.elements.keyStudyFretRange.value = "5-8";
handoffUi.elements.keyStudyIncludeOpen.checked = true;
handoffUi.elements.startButton.dispatch("click");
const handoffItem = handoffUi.api.getCurrentKeyStudyReference().playableItems[0];
const handoffButton = handoffItem.cardElement.children.at(-2);
handoffButton.dispatch("click");
assert.strictEqual(handoffUi.api.getSelectedMode(), "fretboard-voice", "Start Voice Leading Here opens the new Fretboard mode");
assert.strictEqual(handoffUi.elements.setupScreen.hidden, false, "Key Study handoff opens Voice Leading setup for confirmation");
assert.strictEqual(handoffUi.elements.fretboardVoiceKeySelect.value, "g-major", "Key Study handoff preserves the selected key");
assert.strictEqual(handoffUi.elements.fretboardVoiceStringSet.value, "DGB", "Key Study handoff preserves the selected string set");
assert.strictEqual(handoffUi.elements.fretboardVoiceFretRange.value, "5-8", "Key Study handoff preserves the strict fret range");
assert.strictEqual(handoffUi.elements.fretboardVoiceIncludeOpen.checked, true, "Key Study handoff preserves the open-position setting");
assert.strictEqual(handoffUi.elements.fretboardVoiceStartingChord.value, handoffItem.chord.degree, "Key Study handoff preserves the chord");
assert.strictEqual(Number(handoffUi.elements.fretboardVoiceStartingInversion.value), handoffItem.inversion, "Key Study handoff preserves the inversion");
assert.strictEqual(handoffUi.elements.fretboardVoiceStartingLocation.value, "exact", "Key Study handoff switches to Choose Exact Shape");
assert.deepStrictEqual([...handoffUi.api.getFretboardVoiceSelectedFrets()], [...handoffItem.voicing.frets], "Key Study handoff preserves the exact frets");

const fretboardVoiceStorage = new Map();
const savedFretboardVoice = createHarness({ mode: "fretboard-voice" }, fretboardVoiceStorage);
savedFretboardVoice.elements.fretboardVoiceStringSet.value = "ADG";
savedFretboardVoice.elements.fretboardVoiceStartingChord.value = "vi";
savedFretboardVoice.elements.fretboardVoiceStartingInversion.value = "2";
savedFretboardVoice.elements.fretboardVoiceFretRange.value = "any";
savedFretboardVoice.elements.fretboardVoiceProgressionSource.value = "common";
savedFretboardVoice.elements.fretboardVoiceCommonProgression.value = "vi-IV-I-V";
savedFretboardVoice.elements.fretboardVoiceShowMovement.checked = true;
savedFretboardVoice.elements.fretboardVoiceStartingLocation.value = "exact";
savedFretboardVoice.elements.fretboardVoiceStartingLocation.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceStringSet.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceStartingChord.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceStartingInversion.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceFretRange.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceProgressionSource.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceCommonProgression.dispatch("change");
savedFretboardVoice.elements.fretboardVoiceShowMovement.dispatch("change");
if (savedFretboardVoice.elements.fretboardVoiceStartingShapes.children.length) {
  savedFretboardVoice.elements.fretboardVoiceStartingShapes.children[0].dispatch("click");
}
const persistedExactFrets = savedFretboardVoice.api.getFretboardVoiceSelectedFrets();
assert(persistedExactFrets, "a valid exact starting shape is available for the persistence test");
assert.strictEqual(JSON.parse(fretboardVoiceStorage.get("fretboard-voice-leading-settings")).exactSelectionExplicit, true, "a deliberately selected compatible exact shape is marked explicitly in saved settings");
const restoredFretboardVoice = createHarness({}, fretboardVoiceStorage);
assert.strictEqual(restoredFretboardVoice.api.getSelectedMode(), "fretboard-voice", "Fretboard Voice Leading mode persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceStringSet.value, "ADG", "voice-leading string set persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceStartingChord.value, "vi", "starting chord persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceStartingInversion.value, "2", "starting inversion persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceFretRange.value, "any", "fret range persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceCommonProgression.value, "vi-IV-I-V", "progression preset persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceStartingLocation.value, "exact", "Choose Exact Shape mode persists");
assert.strictEqual(restoredFretboardVoice.elements.fretboardVoiceShowMovement.checked, true, "movement-detail preference persists");
assert.deepStrictEqual([...restoredFretboardVoice.api.getFretboardVoiceSelectedFrets()], [...persistedExactFrets], "the exact starting frets persist when still valid");

const implicitLegacyExactSettings = JSON.parse(
  fretboardVoiceStorage.get("fretboard-voice-leading-settings")
);
delete implicitLegacyExactSettings.exactSelectionExplicit;
const implicitLegacyExactStorage = new Map([
  ["fretboard-voice-leading-settings", JSON.stringify(implicitLegacyExactSettings)]
]);
const migratedImplicitLegacyExact = createHarness(
  { mode: "fretboard-voice" },
  implicitLegacyExactStorage
);
assert.strictEqual(migratedImplicitLegacyExact.elements.fretboardVoiceStartingLocation.value, "auto", "legacy exact state without explicit intent migrates to Auto even when its frets happen to be valid");
assert.strictEqual(migratedImplicitLegacyExact.api.getFretboardVoiceSelectedFrets(), null, "implicit legacy exact frets are cleared during Auto migration");

const staleSavedRouteSettings = {
  ...JSON.parse(fretboardVoiceStorage.get("fretboard-voice-leading-settings")),
  routeStale: true
};
const staleSavedRouteStorage = new Map([
  ["fretboard-voice-leading-settings", JSON.stringify(staleSavedRouteSettings)]
]);
const migratedSavedStaleRoute = createHarness(
  { mode: "fretboard-voice" },
  staleSavedRouteStorage
);
assert.strictEqual(migratedSavedStaleRoute.elements.fretboardVoiceStartingLocation.value, "auto", "saved stale-route state normalizes to Auto on load");
assert.strictEqual(migratedSavedStaleRoute.api.getFretboardVoiceSelectedFrets(), null, "saved stale-route migration clears the incompatible physical shape");
assert.strictEqual(migratedSavedStaleRoute.api.getCurrentFretboardVoiceRoute(), null, "saved stale-route migration does not restore a blocking route object");

const legacyFretboardVoiceStorage = new Map([
  ["fretboard-voice-leading-settings", JSON.stringify({ routeMode: "cycle" })]
]);
const migratedFretboardVoice = createHarness({ mode: "fretboard-voice" }, legacyFretboardVoiceStorage);
assert.strictEqual(migratedFretboardVoice.api.getFretboardVoiceMode(), "study", "an old saved Cycle view migrates to Study");
assert.strictEqual(
  JSON.parse(legacyFretboardVoiceStorage.get("fretboard-voice-leading-settings")).routeMode,
  "study",
  "the migrated Study value replaces Cycle in saved settings"
);
assert.strictEqual(migratedFretboardVoice.elements.fretboardVoiceStartingLocation.value, "auto", "older saved state without a valid exact shape migrates to Auto");
assert.strictEqual(
  JSON.parse(legacyFretboardVoiceStorage.get("fretboard-voice-leading-settings")).startingLocation,
  "auto",
  "the safe Auto migration is persisted"
);

const staleExactStorage = new Map([
  ["fretboard-voice-leading-settings", JSON.stringify({
    startingLocation: "exact",
    selectedFrets: [99, 99, 99],
    stringSet: "GBE",
    startingChord: "I",
    startingInversion: 1,
    fretRange: "any"
  })]
]);
const migratedStaleExact = createHarness({ mode: "fretboard-voice" }, staleExactStorage);
assert.strictEqual(migratedStaleExact.elements.fretboardVoiceStartingLocation.value, "auto", "a stale unavailable exact shape migrates safely to Auto");
assert.strictEqual(migratedStaleExact.elements.fretboardVoiceStartingMessage.className, "hint", "stale exact state does not leave a red warning behind");

assert(/\.fretboard-voice-route\s*\{[\s\S]*grid-template-columns:\s*repeat\(4/.test(html), "desktop layout supports four compact diagrams per row");
assert(/@media \(max-width: 900px\)[\s\S]*\.fretboard-voice-route[^}]*repeat\(2/.test(html), "narrow layouts use two compact diagrams per row without horizontal scrolling");

function escapePreviewText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function serializeFakeElement(element) {
  const tagName = element.tagName.toLowerCase();
  const attributes = { ...element.attributes };
  const classNames = [
    element.className,
    ...element.classes
  ].filter(Boolean).join(" ");
  if (classNames) attributes.class = classNames;
  const attributeText = Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapePreviewText(value)}"`)
    .join("");
  const contents = escapePreviewText(element.textContent) +
    element.children.map(serializeFakeElement).join("");
  return `<${tagName}${attributeText}>${contents}</${tagName}>`;
}

if (process.argv.includes("--render-fretboard-preview")) {
  const coreCompactExamples = [
    { key: cMajor, degree: "I", inversion: 0, strings: "EAD", note: "Major root position" },
    { key: cMajor, degree: "I", inversion: 1, strings: "ADG", note: "Major first inversion" },
    { key: cMajor, degree: "I", inversion: 2, strings: "DGB", note: "Major second inversion" },
    { key: cMajor, degree: "vi", inversion: 0, strings: "GBE", note: "Minor with ♭3" },
    { key: midiApi.keys["f-sharp-major"], degree: "I", inversion: 1, strings: "GBE", note: "Sharp spelling context" },
    { key: midiApi.keys["e-flat-major"], degree: "I", inversion: 2, strings: "DGB", note: "Flat spelling context" }
  ].map(example => ({
    ...example,
    object: fretboardObject(example.key, example.degree, example.inversion)
  })).map(example => ({
    ...example,
    voicing: midiApi.selectFretboardVoicing(example.object, example.strings, {
      includeOpen: true,
      fretRange: "any"
    })
  })).filter(example => example.voicing);

  function compactShapeAtFret(targetFret) {
    for (const currentKey of [cMajor, midiApi.keys["g-major"], midiApi.keys["d-major"]]) {
      for (const currentChord of currentKey.chords) {
        for (let inversion = 0; inversion < 3; inversion += 1) {
          const object = fretboardObject(currentKey, currentChord.degree, inversion);
          for (const strings of ["EAD", "ADG", "DGB", "GBE"]) {
            const voicing = midiApi.generateFretboardVoicings(object, strings, {
              includeOpen: true,
              fretRange: "any"
            }).find(candidate => candidate.frets.includes(targetFret));
            if (voicing) {
              return {
                object,
                voicing,
                strings,
                note: `Representative fret ${targetFret}`
              };
            }
          }
        }
      }
    }
    return null;
  }

  const fretCompactExamples = [3, 5, 7, 9, 12]
    .map(compactShapeAtFret)
    .filter(Boolean);
  const previewCards = [...coreCompactExamples, ...fretCompactExamples].map(example => {
    const { object, voicing } = example;
    const diagram = midiApi.buildChordDiagramData(object, voicing, "chord-tones");
    midiApi.renderFretboardDiagram(diagram, harness.elements.fretboardDiagram, { compact: true });
    const svg = serializeFakeElement(harness.elements.fretboardDiagram.children[0]);
    return `<article><h2>${escapePreviewText(object.chordName)}</h2><p>${escapePreviewText(object.inversion.name)} · ${example.strings}</p><small>${escapePreviewText(example.note)}</small>${svg}</article>`;
  }).join("");
  fs.writeFileSync(
    "/tmp/fretboard-diagram-preview.html",
    `<!doctype html><html><head><meta charset="utf-8"><style>
      body{margin:0;padding:24px;background:#f7f5ef;color:#17201d;font-family:system-ui,sans-serif}
      main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-width:1500px;margin:auto}
      article{min-width:0;border:1px solid #c9cec9;border-radius:14px;padding:12px;background:white;text-align:left}
      h2{margin:0;font-size:16px}p{margin:4px 0;color:#5f6965;font-size:14px;text-transform:capitalize}small{display:block;color:#5f6965;font-weight:700}
      svg{display:block;width:100%;height:auto;max-height:205px;margin:auto;overflow:visible}
      @media(max-width:900px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){svg{max-height:175px}}
    </style></head><body><main>${previewCards}</main></body></html>`
  );
}

async function runMidiAccessTests() {
  let permissionRequests = 0;
  const firstInput = { id: "input-1", name: "Test Keyboard", state: "connected", onmidimessage: null };
  const access = { inputs: new Map([[firstInput.id, firstInput]]), onstatechange: null };
  const navigatorWithMidi = {
    requestMIDIAccess: async () => {
      permissionRequests += 1;
      return access;
    }
  };
  const accessHarness = createHarness({}, new Map(), navigatorWithMidi);
  assert.strictEqual(permissionRequests, 0, "MIDI permission is not requested on page load");
  await accessHarness.api.enableMidi();
  assert.strictEqual(permissionRequests, 1, "Enable MIDI requests permission after a user action");
  assert.strictEqual(accessHarness.elements.midiControls.hidden, false, "device and answer controls appear after permission");
  assert.strictEqual(typeof firstInput.onmidimessage, "function", "selected input receives a MIDI message handler");
  assert(accessHarness.elements.midiSetupStatus.textContent.includes("Test Keyboard"), "connected device name is displayed");

  firstInput.state = "disconnected";
  access.onstatechange();
  assert.strictEqual(accessHarness.elements.midiSetupStatus.textContent, "No MIDI input is connected.", "disconnect is handled without crashing");
  const secondInput = { id: "input-2", name: "Second Keyboard", state: "connected", onmidimessage: null };
  access.inputs.set(secondInput.id, secondInput);
  access.onstatechange();
  assert(accessHarness.elements.midiSetupStatus.textContent.includes("Second Keyboard"), "a device connected later is detected");

  const deniedHarness = createHarness({}, new Map(), {
    requestMIDIAccess: async () => {
      throw new Error("denied");
    }
  });
  await deniedHarness.api.enableMidi();
  assert.strictEqual(deniedHarness.elements.midiSetupStatus.textContent, "MIDI permission was denied or unavailable.", "permission denial is explained");

  const unsupportedHarness = createHarness();
  assert.strictEqual(unsupportedHarness.elements.midiSetupStatus.textContent, "MIDI is not supported in this browser.", "unsupported browsers are handled gracefully");
}

runMidiAccessTests()
  .then(() => {
    console.log("PASS: Chord Practice individual/progression modes, expanded chords, nearest voicings, MIDI, migrations, Fretboard Voice Leading, persistence, Favorites, shortcuts, and devices verified");
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
