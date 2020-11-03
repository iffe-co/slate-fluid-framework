import {getSlateModel} from "./utils/model-getter";
import {getEditor} from "./utils/editor-getter";
import SocketIO from "socket.io"
import {v4} from "uuid"

const clients: { [key: string]: { ack: boolean, statusValue?: any } } = {}

const isNotIdle = () => !Object.values(clients).every(v => v.ack)

const getALuckClient = () => Object.keys(clients)[Math.floor(Math.random() * (Object.keys(clients).length + 1))]

const needResponseStatusKey = []

const checkStatus = () => {
    const equal = Object.values(needResponseStatusKey).reduce((p, c) => {
        if (p && clients[p].statusValue !== clients[c].statusValue) {
            return false
        } else {
            return c
        }
    })
    return !equal
}

const FSM = {
    resolve_op: async (io: SocketIO.Server) => {
        const clientId = getALuckClient()
        io.emit("resolve_op", clientId)
        return 'report_status'
    },
    report_status: async (io: SocketIO.Server) => {
        io.emit("report_status")
        return 'check_status'
    },
    check_status: async (io: SocketIO.Server) => {
        if (isNotIdle() && checkStatus()) {
            return 'resolve_op'
        } else {
            return 'end_test'
        }
    },
    end_test: async (io: SocketIO.Server) => {
        io.emit("end_test")
    }
}

async function init() {
    const {id} = await getSlateModel()
    const {model, initValue} = await getSlateModel(id)
    const editor = getEditor(model, initValue)
    return {
        id,
        editor
    }
}

function initSocket(modelId: string) {
    const io = new SocketIO();
    io.on('connection', (socket) => {
        const clientId = v4();
        clients[clientId] = {ack: true}
        socket.emit('connect_success', {clientId, modelId})
    });

    io.on('task_ack', ({id}) => {
        if (clients[id].ack) {
            console.warn(`${id} ack twice!`)
        }
        clients[id].ack = true
    })
    return io
}

async function sleep(seconed: number) {

}

async function CYCLE_RUN (io: SocketIO.Server) {
    if (isNotIdle()) {
        return
    }


}

async function start() {
    const {id, editor} = await init()
    const io = initSocket(id)
    io.listen(7890);
}

start().then(() => {
    console.log('server started')
})
