on run argv
    set imagePath to item 1 of argv
    tell application "Photos"
        if exists album "M.Card" then
            set targetAlbum to album "M.Card"
        else
            set targetAlbum to make new album named "M.Card"
        end if
        set importedItems to import {POSIX file imagePath} into targetAlbum
        if (count of importedItems) is 0 then error "No new photo was imported; it may already exist in Photos"
    end tell
    return "ok"
end run
