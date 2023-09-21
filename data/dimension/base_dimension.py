from abc import ABC, abstractmethod


class BaseDimension(ABC):
    @abstractmethod
    def get_dimension_value(self):
        pass

    # Return a human readable string that represents this dimension type
    @abstractmethod
    def pretty_print(self):
        pass
