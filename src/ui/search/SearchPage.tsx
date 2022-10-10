import {useContext} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {FormSelect, InputGroup} from "react-bootstrap";

export const SearchPage: React.FC = () => {
  const context = useContext(MegaContext)
  return <>
    <p>Search</p>
    <FormSelect>
      {Object.keys(context.settings.value.searchHosts).map((k) => <option>{k}</option>)}
    </FormSelect>
  </>
}
