import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ProgressViewIOS, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Button } from 'react-native';
import { Fontisto } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { menus } from './Menus';
import { themes } from './Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckBox from 'react-native-check-box'

const TODOS_KEY = "todos-key"

export default function App() {

  const [currentMenu, setCurrentMenu] = useState(menus.GROCERIES);
  const [text, setText] = useState("");
  const [todos, setTodos] = useState(null);
  const [completePercent, setCompletePercent] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState({
    key : null,
    text : '',
  });

  useEffect(()=>{
    loadTodos()
  },[])

  useEffect(()=>{
    if(todos){

      calculateCompletionPercent()
    }
  },[todos, currentMenu])

  const loadTodos = async () => {
    try{
      const data = await AsyncStorage.getItem(TODOS_KEY)
      if(data!==null){
        setTodos(JSON.parse(data))
      }
    }catch(e) {
      alert("loading fail...")
    }
  }

  const getThemeMode = () => {
    switch(currentMenu){
      case menus.GROCERIES :
        return themes.LIGHT_MODE;
      case menus.WORK : 
        return themes.DARK_MODE;
    }
  } 

  const addTodo = () => {

    const newTodos = {
      ...todos,
      [Date.now()] : {
        text : text,
        type : currentMenu,
        isDone : false
      }
    }

    setTodos(newTodos)
    saveTodosInStorage(newTodos)

    setText("");
  }

  const saveEditChanged = () => {

    const editedTodos = {
      ...todos,
      [editTarget.key] : {
        ...todos[editTarget.key],
        text : editTarget.text
      }
    }

    setTodos(editedTodos)
    saveTodosInStorage(editedTodos)
    setModalOpen(!modalOpen);
  }

  const completeTodo = (key) => {

    const newTodos = {
      ...todos,
      [key] : {
        ...todos[key],
        isDone : !todos[key].isDone
      }
    }

    setTodos(newTodos)
    saveTodosInStorage(newTodos)
  }

  const saveTodosInStorage = async (newTodos) => {
    try{
      await AsyncStorage.setItem(TODOS_KEY, JSON.stringify(newTodos))
    }catch(e){
      alert("save data fail...")
    }
  }

  const deleteTodo = (key) => {
    Alert.alert("Delete To Do?", "Are you sure?", [
      { text : "Cancel", style: "cancel"},
      { text : "OK", onPress : () => {
        const newTodos = {...todos}
        delete newTodos[key]
        setTodos(newTodos);
        saveTodosInStorage(newTodos)
      }}

    ])
  }

  const calculateCompletionPercent = () => {

    let total = Object.keys(todos)
              .filter(key=>todos[key].type===currentMenu)  
              .length;
    
    if(total === 0){
      setCompletePercent(0)
      return;
    }

    let completed = Object.keys(todos)
                .filter(key=>todos[key].type===currentMenu && todos[key].isDone===true)
                .length;
  
    setCompletePercent(completed/total)    
  }

  const editTodo = (key) => {
    //open modal
    setModalOpen(true);
    setEditTarget({
      key : key,
      text : todos[key].text
    });
  }

  return (
    <View style={{...styles.container, backgroundColor : getThemeMode().BACK_GORUND_COLOR}}>
      <StatusBar style="auto" />
      
      <View style={styles.headerBox}>

      <TouchableOpacity onPress={() => setCurrentMenu(menus.GROCERIES)}>
        <Text style={{...styles.menu, color : getThemeMode() === themes.LIGHT_MODE ? themes.LIGHT_MODE.TEXT_COLOR.BASIC : themes.LIGHT_MODE.TEXT_COLOR.DEACTIVE}}>Groceries</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentMenu(menus.WORK)}>
      <Text style={{...styles.menu, color : getThemeMode() === themes.DARK_MODE ? themes.DARK_MODE.TEXT_COLOR.BASIC : themes.DARK_MODE.TEXT_COLOR.DEACTIVE}}>Work</Text>
      </TouchableOpacity>
      
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalOpen}
        onRequestClose={() => {
          setModalOpen(!modalOpen);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput autoFocus style={styles.modalText} onChangeText={(text)=>setEditTarget({...editTarget, text : text})}>{editTarget.text}</TextInput>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', }}>
            <Button
              title='cancle'
              color={'red'}
              onPress={() => setModalOpen(!modalOpen)}
            />
            <Button
              title='save'
              onPress={saveEditChanged}
            />
            </View>
              
          </View>
        </View>
      </Modal>

      <View style={styles.progressBox}>
        <ProgressViewIOS
          style={styles.progress}
          progressTintColor={getThemeMode().TEXT_COLOR.BASIC}
          progress={completePercent}
        />
        <Text style={{...styles.percent, color : getThemeMode().TEXT_COLOR.BASIC}}>{`${Math.floor(completePercent*100)}%`}</Text>
      </View>

      <TextInput
        style={{...styles.input, color : getThemeMode().TEXT_COLOR.BASIC}}
        placeholder={"Add A To Do"}
        placeholderTextColor={getThemeMode().DEACTIVE_MENU_COLOR}
        onChangeText={(text)=>setText(text)}
        value={text}
        onSubmitEditing={addTodo}
      >
      </TextInput>

      <ScrollView style={styles.todoListBox}>

        {todos && Object.keys(todos).map(key=>(

          todos[key].type===currentMenu && 
          
          <View key={key} style={{...styles.todoBox, backgroundColor : getThemeMode().TODO_BACK_GROUND_COLOR}}>
            <CheckBox
              isChecked={todos[key].isDone}
              onClick={()=>completeTodo(key)}
            />
            <Text
              style={{...styles.todoText, color : todos[key].isDone ? getThemeMode().TEXT_COLOR.DEACTIVE : getThemeMode().TEXT_COLOR.BASIC, textDecorationLine : todos[key].isDone ? 'line-through' : ""}}>
              {todos[key].text}
            </Text>
            
            <View style={{flexDirection : "row"}}>
            <TouchableOpacity style={{marginRight : 10}} onPress={()=>editTodo(key)}>
              <Fontisto name="scissors" size={15}></Fontisto>
            </TouchableOpacity>

            <TouchableOpacity onPress={()=>deleteTodo(key)}>
              <Fontisto name="trash" size={15}></Fontisto>
            </TouchableOpacity>
            </View>
          </View>

        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBox : {
    justifyContent : "space-around",
    flexDirection : "row",
    marginTop : 100
  },
  progressBox : {
    flexDirection : "row",
    justifyContent : "space-around",
    paddingHorizontal : 20
  }, 
  todoListBox : {
    marginTop : 30,
    paddingHorizontal : 30,
  },
  todoBox : {
    borderRadius : 15,
    width : 310,
    height : 80,
    paddingVertical : 20,
    paddingHorizontal : 20,
    marginBottom : 10,
    flexDirection : "row",
    justifyContent : "space-between",
    alignItems : 'center'
  },

  menu : {
    fontSize : 35,
    fontWeight : "700",
  },
  progress: {
    marginVertical : 30,
    width: 250,
  },
  percent : {
    marginVertical : 20,
    fontWeight : "500"
  },
  todoText : {
    fontSize : 15,
    fontWeight : "500",
  },
  input : {
    borderRadius : 15,
    fontSize : 15,
    paddingVertical : 15,
    paddingHorizontal : 30,
  },

  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal : 65,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  }
});
