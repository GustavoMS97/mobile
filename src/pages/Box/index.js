import React, { Component } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { distanceInWords } from 'date-fns';
import socket from 'socket.io-client';
import pt from 'date-fns/locale/pt';
import api from '../../services/api';
import styles from './styles';

class Box extends Component {
  state = { box: {} };
  async componentDidMount() {
    const box = await AsyncStorage.getItem('@RocketBox:box');
    this.subscriteToNewFiles(box);
    const response = await api.get(`/boxes/${box}`);
    this.setState({ box: response.data });
  }

  subscriteToNewFiles = (boxId) => {
    const io = socket('https://omnistack-backend-node.herokuapp.com/');
    io.emit('connectRoom', boxId);
    io.on('file', (data) => {
      this.setState({
        box: { ...this.state.box, files: [data, ...this.state.box.files] },
      });
    });
  };

  handleUpload = () => {
    ImagePicker.launchImageLibrary({}, async (upload) => {
      if (upload.error) {
        Alert.alert('Erro', upload.error, [{ text: 'OK' }]);
      } else if (upload.didCancel) {
        Alert.alert('Erro', 'Cancelou', [{ text: 'OK' }]);
      } else {
        const data = new FormData();
        const [prefix, suffix] = upload.fileName.split('.');
        const ext = suffix.toLowerCase() === 'heic' ? 'jpg' : suffix;
        data.append('file', {
          uri: upload.uri,
          type: upload.type,
          name: `${prefix}.${ext}`,
        });

        api.post(`boxes/${this.state.box._id}/files`, data);
      }
    });
  };

  openFile = async (file) => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`;
      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: filePath,
      });
      await FileViewer.open(filePath);
    } catch (error) {
      Alert.alert('Erro', error, [{ text: 'OK' }]);
    }
  };

  renderItem = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => this.openFile(item)} style={styles.file}>
        <View style={styles.file}>
          <Icon name='insert-drive-file' size={24} color='#a5cfff' />
          <Text style={styles.fileTitle}>{item.title}</Text>
        </View>

        <Text style={styles.fileDate}>
          Há{' '}
          {distanceInWords(item.createdAt, new Date(), {
            locale: pt,
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.boxTitle}>{this.state.box.title}</Text>
        <FlatList
          style={styles.list}
          keyExtractor={(file) => file._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          data={this.state.box.files}
          renderItem={this.renderItem}
        />
        <TouchableOpacity style={styles.fab} onPress={this.handleUpload}>
          <Icon name='cloud-upload' size={24} color='#fff' />
        </TouchableOpacity>
      </View>
    );
  }
}

export default Box;
