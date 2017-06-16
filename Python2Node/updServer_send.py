import triad_openvr
import time
import sys
import socket
import json

v = triad_openvr.triad_openvr()
v.print_discovered_objects()

if len(sys.argv) == 1:
    interval = 1/float(120)
elif len(sys.argv) == 2:
    interval = 1/float(sys.argv[0])
else:
    print("Invalid number of arguments")
    interval = False

valid_devices = ["tracker_1"]

UDP_IP = "127.0.0.1"
UDP_PORT = 10000
MESSAGE = b"Hello, World!"
 
print ("UDP target IP:", UDP_IP)
print ("UDP target port:", UDP_PORT)
print ("message:", MESSAGE)
 
sock = socket.socket(socket.AF_INET, # Internet
                      socket.SOCK_DGRAM) # UDP
sock.sendto(MESSAGE, (UDP_IP, UDP_PORT))

if interval:
    while(True):
        start = time.time()
        txt = ""
        for device_key in v.devices.keys():
            if device_key not in valid_devices:
                continue
            new_data = {}
            data_ = v.devices[device_key].get_pose_quaternion()
            new_data['name'] = device_key
            new_data['x'] = data_[0]
            new_data['y'] = data_[1]
            new_data['z'] = data_[2]
            new_data['qw'] = data_[3]
            new_data['qx'] = data_[4]
            new_data['qy'] = data_[5]
            new_data['qz'] = data_[6]

            jsondata = json.dumps(new_data)
            sock.sendto(jsondata.encode('utf-8'), (UDP_IP, UDP_PORT))
        
        sleep_time = interval-(time.time()-start)
        if sleep_time>0:
            time.sleep(sleep_time)
