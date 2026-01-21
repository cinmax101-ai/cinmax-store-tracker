; CinMax Store Installer Script
; Custom NSIS configuration

!macro customHeader
    !system "echo 'Building CinMax Store Installer...'"
!macroend

!macro customInit
    ; Set Arabic as default language
    StrCpy $LANGUAGE 1025
!macroend

!macro customInstall
    ; Create app data directory
    CreateDirectory "$APPDATA\CinMax Store"
    
    ; Create desktop shortcut
    CreateShortCut "$DESKTOP\CinMax Store.lnk" "$INSTDIR\CinMax Store.exe"
!macroend

!macro customUnInstall
    ; Ask user if they want to delete data
    MessageBox MB_YESNO "هل تريد حذف جميع البيانات والإعدادات؟" IDNO skipDeleteData
        RMDir /r "$APPDATA\CinMax Store"
    skipDeleteData:
    
    ; Remove desktop shortcut
    Delete "$DESKTOP\CinMax Store.lnk"
!macroend