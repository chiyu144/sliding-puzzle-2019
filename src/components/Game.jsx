import React, { Component } from 'react';
import axios from 'axios';

// UI
import Popup from './handmade/Popup';

// Logic
import Info from './Info';
import Tiles from './Tiles';
import Start from './Start';

class Game extends Component {
  state = {
    // Game Data
    isStart: false,
    isSolved: false,
    isPop: false,
    quiz: '',
    photographer: '',
    photographerProfile: '',

    // Unsplash API Demo mode 一天限 Request 50 次，超過 or 省次數的畫先用這個
    // 'https://source.unsplash.com/300x300/?cat',

    // Player Data
    playerName: '',
    playerStep: '0',

    // Input Control
    isLock: false,
    placeholder: 'Please Enter Your Name...',

    // Boxes Data
    boxesRow: 3,
    boxesCol: 3,
    boxesSize: 0,
    boxesList: [],
    boxesMatrix: [],
  };

  componentDidMount() {
    const { boxesRow, boxesCol } = this.state;
    this.initSize(boxesRow, boxesCol);
    this.forTest();
    // this.getQuiz();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isStart, boxesCol, boxesRow, boxesSize, boxesList } = this.state;
    if (prevState.boxesSize !== boxesSize) {
      this.initList(boxesSize);
    }
    if (isStart && prevState.boxesList !== boxesList) {
      this.initMatrix(boxesRow, boxesCol, boxesList);
      // 檢查是否破關
      this.checkSolved();
    }
    if (prevState.isStart !== isStart) {
      this.toggleIsLock();
    }
  }

  forTest = () => {
    setTimeout(() => {
      this.setState({
        quiz: 'https://source.unsplash.com/300x300/?cat',
      });
    }, 1000);
  };

  // 用 axios 串接 Unsplash API 取得貓咪圖片作為拼圖題目
  getQuiz = async () => {
    const res = await axios.get('https://api.unsplash.com/photos/random', {
      headers: {
        Authorization: 'Client-ID ba8681023a3d34f44297a986501a75a42b07494085bc0205e245de1d1aa88a87',
      },
      params: {
        query: 'cat',
      },
    });
    const quiz = `${res.data.urls.raw}&w=300&h=300&fit=crop&crop=center`;
    const photographer = `${res.data.user.name}`;
    const photographerProfile = `${res.data.user.links.html}`;
    console.log(res.data);
    this.setState({ quiz, photographer, photographerProfile });
  };

  findCoord = val => {
    const { boxesMatrix } = this.state;
    for (let i = 0; i < boxesMatrix.length; i += 1) {
      for (let j = 0; j < boxesMatrix.length; j += 1) {
        if (boxesMatrix[i][j] === parseInt(val, 10)) {
          return { x: i, y: j };
        }
      }
    }
    return -1;
  };

  canSwap = tile => {
    const tileX = this.findCoord(tile).x;
    const tileY = this.findCoord(tile).y;
    const gapX = this.findCoord(9).x;
    const gapY = this.findCoord(9).y;
    return Math.abs(tileX - gapX) + Math.abs(tileY - gapY) === 1;
  };

  swap = val => {
    const { boxesList } = this.state;
    const swapList = [...boxesList];
    const tile = swapList.indexOf(parseInt(val, 10));
    const gap = swapList.indexOf(9);
    const tmp = swapList[tile];
    swapList[tile] = swapList[gap];
    swapList[gap] = tmp;
    this.setState({ boxesList: swapList });
  };

  // calcDistance = ({ x, y }) => {
  //   return {
  //     xMove: x * 100,
  //     yMove: y * 100,
  //   };
  // };

  clickTile = e => {
    const { isStart } = this.state;
    if (isStart) {
      const val = e.currentTarget.value;
      // 檢查是否和挖空相鄰（用矩陣），相鄰代表可移動
      if (this.canSwap(val)) {
        // 如可移動，就 Target 跟 挖空 換位
        // cue 換位動畫（動畫時其他地方鎖起來以防 User 連續亂按）
        this.swap(val);
        // step ++
        this.setState(prevState => {
          return { playerStep: `${parseInt(prevState.playerStep, 10) + 1}` };
        });
        // 不可移動，就何も起こらない
      }
    }
  };

  checkSolved = () => {
    const { boxesList } = this.state;
    const ideal = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (boxesList.join() === ideal.join()) {
      console.log('Solved!!!');
      this.setState({ isStart: false, isSolved: true });
    }
    // 如果破關，cue 破關動畫（動畫時其他地方鎖起來以防 User 連續亂按）
    // isStart 變回 false，ReStart 變回 Start
    // 沒破關，何も起こらない
  };

  clickStart = () => {
    // 檢查有無名字，有才能玩，沒有要跳 Popup 提醒
    const { playerName, isStart, isSolved } = this.state;
    if (!playerName || playerName === '') {
      this.setState({
        isPop: true,
      });
    } else {
      if (!isStart && isSolved) {
        // 初クリア後繼續玩新一局
        this.setState({ quiz: '' });
        this.forTest();
        // this.getQuiz();
      }
      // isStart 變 true，isSolved 要變 false
      this.setState({
        isStart: true,
        isSolved: false,
        playerStep: '0',
      });
      // shuffle 磁磚們
      this.shuffleTiles();
    }
  };

  toggleIsPop = () => {
    this.setState(prevState => {
      return { isPop: !prevState.isPop };
    });
  };

  toggleIsLock = () => {
    this.setState(prevState => {
      return { isLock: !prevState.isLock };
    });
  };

  fisherYates = list => {
    const newList = [...list];
    for (let i = newList.length - 1; i > 0; i -= 1) {
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = newList[i];
      newList[i] = newList[r];
      newList[r] = tmp;
    }
    return newList;
  };

  isSolvable = list => {
    let inversions = 0;
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (list[i] > list[j]) {
          inversions += 1;
        }
      }
    }
    console.log('inversions: ', inversions);
    return inversions % 2 === 0;
  };

  shuffleTiles = () => {
    const { boxesList } = this.state;
    // 先洗牌
    const newBoxesList = this.fisherYates([...boxesList]);
    // 檢查 inversion 是基數還偶數（基數會破不了關，偶數才能破關）
    if (!this.isSolvable(newBoxesList)) {
      // 如果基數，List 前兩個人再換位，讓 inversion 變偶數
      const tmp = newBoxesList[0];
      newBoxesList[0] = newBoxesList[1];
      newBoxesList[1] = tmp;
      this.isSolvable(newBoxesList);
      this.setState({ boxesList: newBoxesList });
    } else {
      this.setState({ boxesList: newBoxesList });
    }
  };

  blurInput = () => {
    const { playerName } = this.state;
    if (!playerName || playerName === '') {
      this.setState({ placeholder: 'Please Enter Your Name...' });
    }
  };

  focusInput = () => {
    this.setState({ placeholder: '' });
  };

  changeName = e => {
    this.setState({
      playerName: e.target.value,
    });
  };

  initSize = (row, col) => {
    const size = row * col;
    this.setState({ boxesSize: size });
  };

  initList = size => {
    const list = Array.from({ length: size }, (v, i) => i + 1);
    this.setState({ boxesList: list });
  };

  initMatrix = (row, col, list) => {
    const oneD = [...list];
    const twoD = [];

    let rowNum = row > 0 ? row : 0;

    while (rowNum && oneD.length > 0) {
      rowNum -= 1;
      const chunk = oneD.splice(0, col);
      twoD.push(chunk);
    }

    this.setState({ boxesMatrix: twoD });
  };

  render() {
    const {
      isStart,
      isPop,
      quiz,
      placeholder,
      playerStep,
      isLock,
      boxesList,
      photographerProfile,
      photographer,
    } = this.state;
    return (
      <div className='game'>
        <div className='game-info'>
          <Info
            changeName={this.changeName}
            placeholder={placeholder}
            blurInput={this.blurInput}
            focusInput={this.focusInput}
            isLock={isLock}
          />
          <Info playerStep={playerStep} />
          <Info quiz={quiz} />
        </div>
        <Tiles isStart={isStart} boxesList={boxesList} clickTile={this.clickTile} quiz={quiz} />
        <p className='game-credit'>
          Photo by{' '}
          <a href={photographerProfile} target='_blank' rel='noopener noreferrer'>
            {photographer}
          </a>{' '}
          on{' '}
          <a href='https://unsplash.com' target='_blank' rel='noopener noreferrer'>
            Unsplash
          </a>
        </p>
        <Start isStart={isStart} clickStart={this.clickStart} />
        <Popup isPop={isPop} toggleIsPop={this.toggleIsPop} />
      </div>
    );
  }
}

export default Game;
