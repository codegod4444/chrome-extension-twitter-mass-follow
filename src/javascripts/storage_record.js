let storage = chrome.storage.local

class StorageRecord {
  constructor(key) {
    this.key = key
  }
  fetch() {
    return new Promise((resolve, reject) => {
      storage.get(this.key, (result) => {
        if ( result.hasOwnProperty(this.key) ) {
          resolve(result[this.key])
        } else {
          reject('Record not found!')
        }
      })
    })
  }
  save() {
    let object = {}
    object[this.key] = this._value
    storage.set(object)
  }
}

export default StorageRecord
