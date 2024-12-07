import encoder from 'react-native-base64'

import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";
import { Button, View, Text } from "react-native";
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

      const command = 'NRF.nfcURL("https://wallet.coinbase.com");\n';
      const base64 = encoder.encode(command, "utf-8");


      const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
      const rxCharacteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

      
      const txCharacteristicUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
      device.monitorCharacteristicForService(
        serviceUUID,
        txCharacteristicUUID,
        (error, characteristic) => {
          if (error || !characteristic) {
            console.error("Notification error: ", error);
            return;
          }
          const receivedString = encoder.encode(
            characteristic.value ?? "",
            "base64"
          );
          console.log("Puck responded: ", receivedString);
        }
      );

      await deviceConnection.writeCharacteristicWithResponseForService(
        serviceUUID,
        rxCharacteristicUUID,
        base64
      );
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  return (
    <View>
      {allDevices &&
        allDevices.map((device) => (
          <Button
            key={device.id}
            onPress={() => connectToDevice(device)}
            title={device.name ?? "Unknown device"}
          />
        ))}
    </View>
  );
}
