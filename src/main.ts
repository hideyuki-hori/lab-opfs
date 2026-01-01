main()

async function main() {
  try {
    var root = await navigator.storage.getDirectory()
  } catch (e) {
    if (e instanceof DOMException) {
      // 発生する可能性があるエラーの種類
      // - SecurityError
      // ユーザーエージェントが要求されたディレクトリーをローカルの OPFS にマップできないとき投げられます。
      // refs: https://developer.mozilla.org/ja/docs/Web/API/StorageManager/getDirectory#%E4%BE%8B%E5%A4%96
    }
    throw e
  }

  try {
    // ファイルがなかったら新規作成して取得
    var draftHandle = await root.getFileHandle('draft.txt', { create: true })
  } catch (e) {
    // refs: https://developer.mozilla.org/ja/docs/Web/API/FileSystemDirectoryHandle/getFileHandle#%E4%BE%8B%E5%A4%96
    if (e instanceof DOMException) {
      // 発生する可能性があるエラーの種類
      // - NotAllowedError: PermissionStatus が 'granted' でないとき投げられます。
      // - TypeMismatchError: 指定されたエントリーがディレクトリーであってファイルではないとき投げられます。
      // - NotFoundError: ファイルが存在せず、create オプションが false に設定されているとき投げられます。
    }
    if (e instanceof TypeError) {
      // 指定された名前が有効な文字列でないか、ネイティブのファイルシステムで支障が出る文字を含むとき投げられます。
    }
    throw e
  }

  try {
    var writable = await draftHandle.createWritable()
  } catch (e) {
    // refs: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable#exceptions
    if (e instanceof DOMException) {
      // 発生する可能性があるエラーの種類
      // - NotAllowedError: Thrown if the PermissionStatus.state for the handle is not 'granted' in readwrite mode.
      // - NotFoundError: Thrown if current entry is not found.
      // - NoModificationAllowedError: Thrown if the browser is not able to acquire a lock on the file associated with the file handle. This could be because mode is set to exclusive and an attempt is made to open multiple writers simultaneously.
      // - AbortError: Thrown if implementation-defined malware scans and safe-browsing checks fails.
    }
    throw e
  }

  try {
    await writable.write('add')
  } catch (e1) {
    // refs: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write#exceptions
    if (e1 instanceof DOMException) {
      // - NotAllowedError: Thrown if PermissionStatus.state is not granted.
      // - QuotaExceededError: Thrown if the new size of the file is larger than the original size of the file, and exceeds the browser's storage quota.
      // - TypeError: Thrown if data is undefined, or if position or size aren't valid.
    }
    throw e1
  } finally {
    try {
      await writable.close()
    } catch (e2) {
      // refs: https://developer.mozilla.org/docs/Web/API/WritableStream/getWriter
      // ここに到達したらreloadを促すくらいしか回復の手段がない
      if (e2 instanceof TypeError) {
        // The stream you are trying to close is locked.
        // 基本的にcloseは例外を飛ばさない
      }
    }
  }

  try {
    // writable.writeの完了前にfileを取得するとエラーになる
    // main.ts:85 Uncaught (in promise) NotReadableError: The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.
    var file = await draftHandle.getFile()
  } catch (e) {
    // 2026-01-01: 日本語版docsに不備があるため英語を参照
    // refs: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/getFile#exceptions
    if (e instanceof DOMException) {
      // - NotAllowedError DOMException: Thrown if the PermissionStatus.state is not granted in read mode.
      // - NotFoundError DOMException: Thrown if current entry is not found.
    }
    throw e
  }

  // file.textの例外については今回の調査対象ではないため省略する
  const content = await file.text()
  console.log(content)
}
