const { ServiceBroker } = require("moleculer");
const HTTPServer = require("moleculer-web");
const { v4: uuidv4 } = require('uuid');


//Crear instancia del broker para el nodo-1
const brokerNode1 = new ServiceBroker({
  nodeID: "node-1",
  transporter: "NATS"
});

// CCrear Apigetaway
brokerNode1.createService({
  name: "gateway",
  mixins: [HTTPServer],

  settings: {
    routes: [
      {
        aliases: {
          "GET /tasks": "tasks.listTasks", // Get todas las tareas
          "POST /task": "tasks.createTask", // Crear tarea
          "GET /lists": "lists.getLists", // Get todas las listas
          "POST /list": "lists.createList", // Crear lista
        }
      }
    ],

    cors: {
      origin: "*", 
      methods: ["GET", "POST"], // Métodos HTTP permitidos
      allowedHeaders: ["Content-Type"], // Set headers
      exposedHeaders: [], 
      credentials: false, 
      maxAge: 3600 
    }
  }
});

//Crear instancia del broker para el nodo-2
const brokerNode2 = new ServiceBroker({
  nodeID: "node-2",
  transporter: "NATS"
});

// Array para las listas
const lists = [];

// Crear servicio listas
brokerNode2.createService({
  name: "lists",

  actions: {
    getLists() {
      
      return lists;
    },

    createList(ctx) {
      // Crear nueva lista
      const { listName } = ctx.params;
      const newList = { id: generateListId(), listName };
    
      lists.push(newList);
      return newList;
    },
  }
});

const tasks = [];

const brokerNode3 = new ServiceBroker({
  nodeID: "node-3",
  transporter: "NATS"
});

brokerNode3.createService({
  name: "tasks",

  actions: {
    listTasks() {
    
      return tasks;
    },

    createTask(ctx) {
      // Crear una nueva tarea
      const { taskName, listId } = ctx.params;
      const newList = lists.find((list) => list.id === listId);

      if (!newList) {
        throw new Error(`List with ID ${listId} not found.`);
      }

      const newTask = { id: generateTaskId(), taskName:taskName, completed: false, listId:listId };
      
      tasks.push(newTask);
      return newTask;
    },
  }
});

// Start brokers
Promise.all([brokerNode1.start(), brokerNode2.start(), brokerNode3.start()]);

// Funciones para crear id
function generateTaskId() {
  const uniqueId = uuidv4();
  return uniqueId;
}

function generateListId() {
  const uniqueId = uuidv4();
  return uniqueId;
}
