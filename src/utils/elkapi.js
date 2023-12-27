import elkjs from "https://cdn.jsdelivr.net/npm/@qix/elkjs-patched@0.8.0-patch3/+esm"
export class ElkApi {
  #worker
  #id = 0
  #resolvers = {}
  #initialized = false

  constructor() {
    //@ts-ignore
    this.#worker = new elkjs.Worker()
    this.#worker.onmessage = (answer) => {
      const json = answer.data
      const resolver = this.#resolvers[json.id]
      if (resolver) {
        delete this.#resolvers[json.id]
        json.error ? resolver(json.error) : resolver(undefined, json.data)
      }
    }
  }

  async layout(graph, args) {
    const layoutOptions = args?.layoutOptions ?? {}
    const logging = args?.logging ?? false
    const measureExecutionTime = args?.measureExecutionTime ?? false
    if (!this.#initialized) await this.init()
    return this.run("layout", {
      graph,
      layoutOptions,
      options: {
        logging,
        measureExecutionTime,
      },
    })
  }
  async knownLayoutAlgorithms() {
    if (!this.#initialized) await this.init()
    return this.run("algorithms")
  }
  async knownLayoutOptions() {
    if (!this.#initialized) await this.init()
    return this.run("options")
  }
  async knownLayoutCategories() {
    if (!this.#initialized) await this.init()
    return this.run("categories")
  }
  async init() {
    await this.run("register", { algorithms: ["layered"] })
    this.#initialized = true
  }
  async run(cmd, options = {}) {
    const id = this.#id++
    const message = { data: { id, cmd, ...options } }
    return new Promise((resolve, reject) => {
      this.#resolvers[id] = (error, result) => {
        if (error) {
          console.log("err", error)
          this.convertGwtStyleError(error)
          reject(error)
        } else {
          console.log("res", result)
          resolve(result)
        }
      }
      this.#worker.dispatcher.dispatch(message)
    })
  }
  convertGwtStyleError(error) {
    if (!error) return
    const javaException = error.__java$exception
    if (javaException) {
      if (javaException.cause && javaException.cause.backingJsObject) {
        error.cause = javaException.cause.backingJsObject
        this.convertGwtStyleError(error.cause)
      }
      delete error.__java$exception
    }
  }
}
