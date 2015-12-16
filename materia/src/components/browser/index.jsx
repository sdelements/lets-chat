'use strict';

import _ from 'lodash';
import React, { Component } from 'react';

export default class Browser extends Component {
    constructor(props) {
        super(props);
    };
    render() {
        var rooms = _.sortBy(this.props.rooms.items, function(room) {
            return room.userCount
        }).reverse();
        return (
            <div className="lcb-browser" style={{ padding: '20px'}}>
                <span style={{
                    color: '#fff',
                    fontSize: '30px',
                    fontWeight: '200',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    display: 'block'
                }}>
                    Rooms ({rooms.length})
                </span>
                {rooms.map(function(room, i){
                    return <a key={room.id} href="#" style={{
                        color: '#fff',
                        display: 'block',
                        textDecoration: 'none',
                        marginBottom: '5px'
                    }}>({room.userCount}) {room.id} &mdash; {room.name}</a>
                })}
            </div>
        );
    };
};
