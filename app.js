import {validateForm} from './main.js';

import { uid } from './uid.js';
console.log(uid());

const IDB = (function init() {
    let db = null;
    let objectStore = null;
    let DBOpenReq = indexedDB.open('todoList', 4);

    DBOpenReq.addEventListener('error', (err) => {
        console.warn(err);
    });
    DBOpenReq.addEventListener('success', (e) => {
        db = e.target.result;
        //console.log('success', db);
        buildList();
    });
    DBOpenReq.addEventListener('upgradeneeded', (e) => {
        db = e.target.result;
        console.log('update', db);
        if (db.objectStoreNames.contains('todoStore')) {
            db.deleteObjectStore('todoStore');

            objectStore = db.createObjectStore('todoStore', {
                keyPath: 'id'
            });

            objectStore.createIndex('dateIDX', 'todoDate', { unique: false });
        } else {
            objectStore = db.createObjectStore('todoStore', {
                keyPath: 'id'
            });
            
            objectStore.createIndex('dateIDX', 'todoDate', { unique: false });
        }
    });

    // add and update data to the Database
    document.todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let todoDate = document.getElementById('todoDate').value;
        let todoDetail = document.getElementById('todoDetail').value;
        let priorityLevels = document.querySelector('input[type=radio][name="options-outlined"]:checked').value;
        let todoDone = false;
        
        let key = document.todoForm.getAttribute('data-key');
        //console.log(key);

        if ((key !== null) && (todoDate) && (todoDetail)) {
            let todoApp = {
                id: key,
                todoDate,
                todoDetail,
                priorityLevels,
                todoDone
            };

            // transaction
            let txn = makeTxn('todoStore', 'readwrite');
            txn.oncomplete = (e) => {
                buildList();
                clearForm();
            };

            let store = txn.objectStore('todoStore');
            let request = store.put(todoApp);

            request.onsuccess = (e) => {
                console.log('sucessfully updated an object');
            }
            request.onerror = (err) => {
                console.log('error on request to update');
            }

        }

        if ((key === null) && (todoDate) && (todoDetail)) {
            let toDoApp = {
                id: uid(),
                todoDate,
                todoDetail,
                priorityLevels,
                todoDone
            };
            // transaction
            let txn = makeTxn('todoStore', 'readwrite');
            txn.oncomplete = (e) => {
                //console.log(e);

                // build a table todo list
                buildList();
                // clear form
                clearForm();
            }

            let store = txn.objectStore('todoStore');
            let request = store.add(toDoApp);

            request.onsuccess = (e) => {
                console.log('successfully added an object');
                // move on to the next request in the transaction or commit the transaction
            }
            request.onerror = (err) => {
                console.log('error on request to add')
            }
        }

    });

    // update "done" check box
    document.querySelector('.tableList').addEventListener('change', (e) => {
        let checkedBox = e.target;
        let checkedBoxChecked = e.target.checked;
        //console.log(e);

        if (checkedBox.id === 'done') {
            let doneID = checkedBox.closest('[data-key]');
            let id = doneID.getAttribute('data-key');
            //console.log(id);

            let txn = makeTxn('todoStore', 'readwrite');
            txn.oncomplete = (e) => {

            };

            let store = txn.objectStore('todoStore');
            let req = store.get(id);
            req.onsuccess = (e) => {
                //console.log(e);
                let todo = e.target.result;
                console.log(todo);

                let todoApp = {
                    id: todo.id,
                    todoDate: todo.todoDate,
                    todoDetail: todo.todoDetail,
                    priorityLevels: todo.priorityLevels,
                    todoDone: checkedBoxChecked
                }
                //console.log(checkedBoxChecked);
                //console.log({todoApp});
                //document.getElementById('done').checked;
                let reqDone = store.put(todoApp);
            }
            
            req.onerror = (err) => {
                console.warn(err);
            }
        }
    })

    // delete data from database
    document.querySelector('.tableList').addEventListener('click', (e) => {
        let deleteList = e.target;
        //console.log(e);
        if (deleteList.id === 'deleteList') {
            let deleteID = deleteList.closest('[data-key]');
            let id = deleteID.getAttribute('data-key');
           // console.log(id);

            let txn = makeTxn('todoStore', 'readwrite');
            txn.oncomplete = (e) => {
                buildList();
                clearForm();
            };

            let store = txn.objectStore('todoStore');
            //console.log(id, typeof(id));
            let request = store.delete(id);

            request.onsuccess = (e) => {
                console.log('successfully deleted an object');
            }
            request.onerror = (err) => {
                console.log('error in request to delete');
            }
        }
    });

    function buildList() {
        let list = document.querySelector('.tableList');
        list.innerText = '...loading...';

        let txn = makeTxn('todoStore', 'readonly');
        txn.oncomplete = (e) => {
            // transaction for reading all object is complete

        }

        let store = txn.objectStore('todoStore');
        //let getReq = store.getAll();
        let idx = store.index('dateIDX');
        let getReq = idx.getAll();
        getReq.onsuccess = (e) => {
            let request = e.target; // request === getReq === e.target
            //console.log({ request });
            list.innerHTML = request.result
                .map((todo) => {
                    return `
                    <tr data-key=${todo.id}>
                    <th scope="row" id="tableDate">${todo.todoDate}</th>
                    <td id="tableDetail">${todo.todoDetail}</td>
                    <td class="priority">${todo.priorityLevels}</td>
                    <td><input class="form-check-input" type="checkbox" name="checkbox" id="done" value="${todo.todoDone}" ${(todo.todoDone)? 'checked' : ''}></td>
                    <td><i class="fas fa-edit" id="edit"></i></td>
                    <td><i class="fas fa-trash-alt" id="deleteList"></i></td>
                  </tr>
                  `
                })
                .join('\n');
            
        }


        getReq.onerror = (err) => {
            console.warn(err);
        }
    }

    document.querySelector('.tableList').addEventListener('click', (e) => {
        let edit = e.target;
        //console.log(e);
        if (edit.id === 'edit') {
            let editID = edit.closest('[data-key]');
            let id = editID.getAttribute('data-key');
            //console.log(id);
        
            let txn = makeTxn('todoStore', 'readonly');
            txn.oncomplete = (e) => {
    
            }

            let store = txn.objectStore('todoStore');
            //console.log(store);
            //console.log(id);
            let req = store.get(id);
            //console.log({req});
            req.onsuccess = (e) => {
                //console.log(e);
                let todo = e.target.result;
                //console.log(todo);
                
                document.getElementById('todoDate').value = todo.todoDate;
                document.getElementById('todoDetail').value = todo.todoDetail;
                document.querySelector('input[type=radio][name="options-outlined"]:checked').value = todo.priorityLevels;
                document.todoForm.setAttribute('data-key', todo.id);
            };
            req.onerror = (err) => {
                console.warn(err);
            }
        }
        
    }) 
        
    function makeTxn(storeName, mode) {
        let txn = db.transaction(storeName, mode);
        txn.onerror = (err) => {
            console.warn(err);
        }
        return txn;
    }

    document.getElementById('btn-cancel').addEventListener('click', clearForm);

    function clearForm(e) {
        if (e) e.preventDefault();
        document.todoForm.reset();
        document.querySelector('.needs-validation').classList.remove('was-validated');
    }
})();