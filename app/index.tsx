import { BleManager, Device } from "react-native-ble-plx";
import { Button, View } from "react-native";
import { useEffect, useState } from "react";

const bleManager = new BleManager();
const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
  devices.findIndex((device) => nextDevice.id === device.id) > -1;

export default function AccountScreen() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }

      if (device && !!device.name) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  }, []);

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      const services =
        await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      console.log("Connected to device", deviceConnection);
      console.log("Services", services);
      // startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  return (
    <View>
      {allDevices &&
        allDevices.map((device) => (
          <Button key={device.id} onPress={() => connectToDevice(device)}>
            <Text>{device.name}</Text>
          </Button>
        ))}
    </View>
  );
}
