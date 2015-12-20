'use strict';

import _ from 'lodash';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import { Link } from 'react-router';

export default class Browser extends Component {
    constructor(props) {
        super(props);
    };
    render() {
        const rooms = _.sortBy(this.props.rooms, function(room) {
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
                {rooms.map(function(room, i) {
                    return <Link key={room.id} to={`/materia/room/${room.id}`} style={{
                        color: '#fff',
                        display: 'block',
                        textDecoration: 'none',
                        marginBottom: '5px'
                    }}>({room.userCount}) {room.id} &mdash; {room.name}</Link>
                })}
            </div>
        );
    };
};

Browser.propTypes = {
    rooms: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return {
        rooms: state.rooms.items
    }
};

export default connect(mapStateToProps)(Browser);
